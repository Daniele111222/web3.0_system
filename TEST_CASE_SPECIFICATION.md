# IP-NFT System Test Case Specification

**Document Version:** v1.0  
**Generated:** 2026-04-11  
**Based on:** 需求规格说明书.md, chapter-3-requirements.md, IPNFT.sol  

---

## Table of Contents

1. [Test Architecture Overview](#1-test-architecture-overview)
2. [Backend API Tests](#2-backend-api-tests)
3. [Backend Service Layer Tests](#3-backend-service-layer-tests)
4. [Smart Contract Tests (Hardhat)](#4-smart-contract-tests-hardhat)
5. [Integration Tests](#5-integration-tests)
6. [Test Data Fixtures](#6-test-data-fixtures)

---

## 1. Test Architecture Overview

### 1.1 Testing Layers

| Layer | Framework | Location | Scope |
|-------|-----------|----------|-------|
| Backend API | pytest + pytest-asyncio | `backend/tests/` | HTTP endpoints |
| Backend Services | pytest + pytest-asyncio | `backend/tests/` | Business logic |
| Smart Contracts | Hardhat + ethers.js + Chai | `contracts/test/` | On-chain behavior |
| Integration | pytest (manual) | `backend/tests/` | Cross-layer flows |

### 1.2 Business Entities Under Test

```
User ←EnterpriseMember→ Enterprise
    ↓                        ↓
RefreshToken           EnterpriseMember
                        ↓
EmailVerificationToken    Asset ←→ Attachment
PasswordResetToken           ↓
                           Approval ←→ ApprovalAttachment
                              ↓
                           MintRecord
                              ↓
                           NFT (on-chain) ←→ Ownership
```

### 1.3 Asset Status State Machine

```
DRAFT ──→ PENDING ──→ APPROVED ──→ MINTING ──→ MINTED
  ↑          ↓            ↓              ↓
  └──── REJECTED ←───────┘              MINT_FAILED
  │                                        ↓
  └────────────←───────────────────── (can_retry)
```

---

## 2. Backend API Tests

### 2.1 Authentication Tests (`test_auth_api.py`)

**File to create:** `backend/tests/test_auth_api.py`

#### Test Class: `TestUserRegistration`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_register_valid_email` | User registers with valid credentials | None | POST /auth/register with valid email, password, username | 201 Created, user created |
| `test_register_duplicate_email` | Registration with existing email | User exists | POST /auth/register with duplicate email | 400 Bad Request |
| `test_register_weak_password` | Registration with weak password | None | POST with password "123456" | 400 Bad Request, validation error |
| `test_register_missing_fields` | Registration missing required fields | None | POST with empty body | 422 Unprocessable Entity |
| `test_register_enterprise_creation` | Registration creates enterprise | None | POST with enterprise_name | 201 Created, enterprise auto-created |

#### Test Class: `TestUserLogin`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_login_valid_credentials` | Login with correct email/password | User registered | POST /auth/login | 200 OK, access_token + refresh_token |
| `test_login_wrong_password` | Login with incorrect password | User exists | POST with wrong password | 401 Unauthorized |
| `test_login_nonexistent_user` | Login with unknown email | None | POST with fake@email.com | 401 Unauthorized |
| `test_login_rate_limit` | Multiple failed login attempts | None | 11 POST requests within 1 minute | 429 Too Many Requests |
| `test_login_inactive_user` | Login with inactive account | User deactivated | POST with inactive user creds | 401 Unauthorized |

#### Test Class: `TestTokenRefresh`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_refresh_valid_token` | Refresh access token | Valid refresh token | POST /auth/refresh | 200 OK, new access_token |
| `test_refresh_expired_token` | Refresh with expired token | Expired refresh token | POST /auth/refresh | 401 Unauthorized |
| `test_refresh_revoked_token` | Refresh with revoked token | Token revoked on logout | POST /auth/refresh | 401 Unauthorized |
| `test_refresh_invalid_format` | Refresh with malformed token | None | POST with "not.a.token" | 401 Unauthorized |

#### Test Class: `TestWalletBinding`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_bind_wallet_valid_signature` | Bind wallet with valid signature | User logged in | POST /auth/bind-wallet with correct signature | 200 OK, wallet_address updated |
| `test_bind_wallet_invalid_signature` | Bind wallet with wrong signature | User logged in | POST with invalid signature | 400 Bad Request, signature verification failed |
| `test_bind_wallet_already_bound` | Bind wallet already bound to other | User A and User B | User A binds wallet, User B tries same | 400 Bad Request, wallet already claimed |
| `test_bind_wallet_unauthorized` | Bind wallet without auth | None | POST without Authorization header | 401 Unauthorized |

#### Test Class: `TestPasswordReset`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_forgot_password_valid_email` | Request password reset | User exists | POST /auth/forgot-password | 200 OK, email sent |
| `test_forgot_password_rate_limit` | Multiple reset requests | User exists | 2 POST requests within 60s | 429 Too Many Requests |
| `test_reset_password_valid_token` | Reset with valid token | Valid reset token | POST /auth/reset-password with new password | 200 OK, password updated |
| `test_reset_password_expired_token` | Reset with expired token | Expired token | POST /auth/reset-password | 400 Bad Request, token expired |

---

### 2.2 Enterprise Management Tests (`test_enterprise_api.py`)

**File to create:** `backend/tests/test_enterprise_api.py`

#### Test Class: `TestEnterpriseCreation`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_create_enterprise_as_owner` | Create enterprise with current user as owner | User logged in | POST /enterprises with name | 201 Created, user set as owner |
| `test_create_enterprise_duplicate_name` | Create with existing name | Enterprise exists | POST with same name | 400 Bad Request |
| `test_create_enterprise_unauthorized` | Create without auth | None | POST without token | 401 Unauthorized |

#### Test Class: `TestEnterpriseMemberManagement`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_invite_member_as_admin` | Admin invites new member | Admin logged in, enterprise exists | POST /enterprises/{id}/members | 201 Created, invitation sent |
| `test_invite_member_as_viewer` | Viewer tries to invite | Viewer role | POST /enterprises/{id}/members | 403 Forbidden |
| `test_update_member_role` | Update member role | Admin logged in | PUT /enterprises/{id}/members/{user_id} | 200 OK, role updated |
| `test_remove_member_as_owner` | Owner removes member | Owner logged in | DELETE /enterprises/{id}/members/{user_id} | 200 OK, member removed |
| `test_remove_self_as_owner` | Owner cannot remove themselves | Owner logged in | DELETE own membership | 400 Bad Request |
| `test_transfer_ownership` | Transfer ownership to another member | Owner logged in | PUT with new role=owner | 200 OK, ownership transferred |

#### Test Class: `TestEnterpriseWalletBinding`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_bind_enterprise_wallet` | Bind wallet to enterprise | Admin logged in | POST /enterprises/{id}/wallet | 200 OK, wallet bound |
| `test_bind_wallet_already_bound_to_user` | Wallet already bound to user | User has wallet | POST with user's own wallet | 400 Bad Request |

---

### 2.3 Asset Management Tests (`test_asset_api.py`)

**File to create:** `backend/tests/test_asset_api.py`

#### Test Class: `TestAssetCreation`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_create_asset_draft` | Create asset in draft status | User logged in, enterprise exists | POST /assets with all fields | 201 Created, status=DRAFT |
| `test_create_asset_minimal_fields` | Create with only required fields | User logged in | POST with name, type, description | 201 Created |
| `test_create_asset_missing_required` | Create missing required field | User logged in | POST without name | 422 Unprocessable Entity |
| `test_create_asset_invalid_type` | Create with invalid asset type | User logged in | POST with type="invalid" | 422 Unprocessable Entity |
| `test_create_asset_future_date` | Create with future creation date | User logged in | POST with creation_date=tomorrow | 400 Bad Request, date cannot be in future |

#### Test Class: `TestAssetAttachment`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_upload_attachment_pdf` | Upload PDF attachment | Asset exists | POST /assets/{id}/attachments with PDF | 201 Created, ipfs_cid returned |
| `test_upload_attachment_image` | Upload image attachment | Asset exists | POST with JPG/PNG | 201 Created, ipfs_cid returned |
| `test_upload_attachment_too_large` | Upload file >50MB | Asset exists | POST with 51MB file | 413 Payload Too Large |
| `test_upload_unsupported_type` | Upload unsupported file type | Asset exists | POST with .exe file | 400 Bad Request |
| `test_set_primary_attachment` | Set attachment as primary image | Attachment uploaded | PUT /assets/{id}/attachments/{att_id} with is_primary=true | 200 OK |
| `test_delete_attachment` | Delete attachment | Attachment exists | DELETE /assets/{id}/attachments/{att_id} | 200 OK |

#### Test Class: `TestAssetRetrieval`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_list_assets_pagination` | List assets with pagination | 20 assets exist | GET /assets?page=1&size=10 | 200 OK, 10 items, total=20 |
| `test_list_assets_filter_by_type` | Filter by asset type | Patents and trademarks | GET /assets?type=patent | 200 OK, only patents |
| `test_list_assets_filter_by_status` | Filter by status | Various statuses | GET /assets?status=DRAFT | 200 OK, only drafts |
| `test_list_assets_search` | Search by name | Various names | GET /assets?search=patent | 200 OK, matching results |
| `test_get_asset_detail` | Get single asset | Asset exists | GET /assets/{id} | 200 OK, full details with attachments |
| `test_get_asset_not_found` | Get nonexistent asset | None | GET /assets/{fake-uuid} | 404 Not Found |

#### Test Class: `TestAssetUpdate`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_update_draft_asset` | Update asset in draft status | Asset status=DRAFT | PUT /assets/{id} | 200 OK |
| `test_update_minted_asset` | Update asset already minted | Asset status=MINTED | PUT /assets/{id} | 400 Bad Request, cannot modify |
| `test_update_other_enterprise_asset` | Update asset from other enterprise | Two enterprises | Enterprise B tries to update A's asset | 403 Forbidden |

#### Test Class: `TestAssetDeletion`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_delete_draft_asset` | Delete asset in draft | Asset status=DRAFT | DELETE /assets/{id} | 200 OK |
| `test_delete_approved_asset` | Delete approved asset | Asset status=APPROVED | DELETE /assets/{id} | 400 Bad Request, cannot delete |
| `test_delete_asset_unauthorized` | Delete without permission | Member role (not admin) | DELETE /assets/{id} | 403 Forbidden |

---

### 2.4 Approval Workflow Tests (`test_approval_api.py`)

**File to create:** `backend/tests/test_approval_api.py`

#### Test Class: `TestApprovalSubmission`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_submit_asset_for_approval` | Submit draft asset for approval | Asset status=DRAFT | POST /assets/{id}/submit-approval | 200 OK, status→PENDING |
| `test_submit_already_pending` | Submit already pending asset | Asset status=PENDING | POST /assets/{id}/submit-approval | 400 Bad Request |
| `test_submit_without_attachments` | Submit asset without attachments | Asset has no attachments | POST /assets/{id}/submit-approval | 400 Bad Request, attachments required |

#### Test Class: `TestApprovalProcessing`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_approve_asset_as_admin` | Admin approves asset | Asset status=PENDING, Admin role | POST /approvals/{id}/process with action=APPROVE | 200 OK, status→APPROVED |
| `test_reject_asset_with_reason` | Reject asset with reason | Asset status=PENDING | POST with action=REJECT, reason="Invalid data" | 200 OK, status→REJECTED |
| `test_return_asset_for_modification` | Return asset to submitter | Asset status=PENDING | POST with action=RETURN | 200 OK, status→DRAFT |
| `test_process_as_viewer` | Viewer tries to approve | Viewer role | POST /approvals/{id}/process | 403 Forbidden |
| `test_process_already_processed` | Process already approved | Asset status=APPROVED | POST /approvals/{id}/process | 400 Bad Request, already processed |

#### Test Class: `TestBatchApproval`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_batch_approve` | Approve multiple assets | 5 pending assets | POST /approvals/batch with ids=[...] | 200 OK, all approved |
| `test_batch_reject` | Reject multiple assets | 5 pending assets | POST /approvals/batch with action=REJECT | 200 OK, all rejected |
| `test_batch_partial_ownership` | Batch includes other enterprise | Mixed ownership | POST with mixed enterprise assets | 403 Forbidden, batch rejected entirely |

#### Test Class: `TestApprovalRetrieval`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_list_pending_approvals` | List pending approvals | 10 pending approvals | GET /approvals/pending | 200 OK, paginated list |
| `test_list_pending_filtered_by_type` | Filter by approval type | Various types | GET /approvals/pending?type=asset_submit | 200 OK, filtered |
| `test_list_approval_history` | List processed approvals | 20 processed | GET /approvals/history?page=1&size=10 | 200 OK, paginated |
| `test_get_approval_detail` | Get approval with asset info | Approval exists | GET /approvals/{id} | 200 OK, includes asset details |

---

### 2.5 NFT Operations Tests (`test_nft_api.py`)

**File to create:** `backend/tests/test_nft_api.py`

#### Test Class: `TestNFTMinting`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_mint_single_nft` | Mint approved asset | Asset status=APPROVED, has attachment | POST /nft/mint with asset_id | 200 OK, token_id returned, status→MINTED |
| `test_mint_without_attachment` | Mint asset without attachment | Asset status=APPROVED, no attachments | POST /nft/mint | 400 Bad Request, attachment required |
| `test_mint_wrong_status` | Mint non-approved asset | Asset status=DRAFT | POST /nft/mint | 400 Bad Request, status must be APPROVED |
| `test_mint_already_minted` | Mint already minted asset | Asset status=MINTED | POST /nft/mint | 400 Bad Request, already minted |
| `test_mint_unauthorized_role` | Mint as viewer role | Viewer role | POST /nft/mint | 403 Forbidden, only admin/owner |
| `test_mint_ipfs_upload_failure` | IPFS upload fails during mint | IPFS mocked to fail | POST /nft/mint | 500 Internal Server Error, status→MINT_FAILED |
| `test_mint_contract_call_failure` | Contract call fails | Blockchain mocked to fail | POST /nft/mint | 500 Internal Server Error, status→MINT_FAILED |

#### Test Class: `TestNFTBatchMinting`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_batch_mint_50_assets` | Mint maximum batch size | 50 approved assets | POST /nft/batch-mint with 50 ids | 200 OK, 50 tokens minted |
| `test_batch_mint_exceeds_limit` | Mint more than 50 | 51 approved assets | POST /nft/batch-mint with 51 ids | 400 Bad Request, max 50 |
| `test_batch_mint_empty_list` | Mint empty list | None | POST /nft/batch-mint with [] | 400 Bad Request |
| `test_batch_mint_partial_failure` | Part of batch fails | 1 valid, 1 invalid asset | POST /nft/batch-mint with mixed | 207 Multi-Status, results per asset |

#### Test Class: `TestNFTMintStatus`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_get_mint_status_pending` | Get status of pending mint | Mint in progress | GET /nft/mint-status/{task_id} | 200 OK, status=PENDING |
| `test_get_mint_status_completed` | Get status of completed mint | Mint completed | GET /nft/mint-status/{task_id} | 200 OK, status=COMPLETED, token_id |
| `test_get_mint_status_failed` | Get status of failed mint | Mint failed | GET /nft/mint-status/{task_id} | 200 OK, status=FAILED, error |
| `test_retry_failed_mint` | Retry failed mint | Asset status=MINT_FAILED, can_retry=true | POST /nft/retry-mint/{asset_id} | 200 OK, mint retried |
| `test_retry_max_attempts_exceeded` | Retry when max attempts reached | can_retry=false | POST /nft/retry-mint/{asset_id} | 400 Bad Request, max attempts exceeded |

#### Test Class: `TestNFTMintHistory`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_get_mint_history_paginated` | Get mint history | 20 mint records | GET /nft/mint-history?page=1&size=10 | 200 OK, paginated |
| `test_get_mint_history_by_asset` | Get history for specific asset | Mint records exist | GET /nft/mint-history?asset_id={id} | 200 OK, filtered by asset |

---

### 2.6 Ownership Tests (`test_ownership_api.py`)

**File to create:** `backend/tests/test_ownership_api.py`

#### Test Class: `TestOwnershipRetrieval`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_get_enterprise_nfts` | Get all NFTs for enterprise | 5 NFTs owned | GET /ownership/assets | 200 OK, list of owned NFTs |
| `test_get_nft_detail` | Get single NFT ownership detail | NFT exists | GET /ownership/assets/{token_id} | 200 OK, owner, creator, history |
| `test_get_ownership_stats` | Get ownership statistics | NFTs exist | GET /ownership/stats | 200 OK, counts by type/status |

#### Test Class: `TestNFTOwnershipTransfer`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_transfer_nft_valid_owner` | Transfer as current owner | User owns NFT | POST /ownership/transfer | 200 OK, transfer initiated |
| `test_transfer_nft_non_owner` | Transfer without owning | User doesn't own NFT | POST /ownership/transfer | 403 Forbidden |
| `test_transfer_nft_invalid_address` | Transfer to invalid address | User owns NFT | POST with to="invalid" | 400 Bad Request, invalid address |
| `test_transfer_nft_to_zero_address` | Transfer to zero address | User owns NFT | POST with to=0x000... | 400 Bad Request |

#### Test Class: `TestOwnershipHistory`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_get_transfer_history` | Get transfer history for NFT | Multiple transfers | GET /ownership/history/{token_id} | 200 OK, chronological list |
| `test_get_events_for_token` | Get all chain events for NFT | NFT exists | GET /nft/events/{token_id} | 200 OK, mint + transfer events |

---

### 2.7 IPFS Integration Tests (`test_ipfs_api.py`)

**File to create:** `backend/tests/test_ipfs_api.py`

#### Test Class: `TestIPFSFileUpload`

| Test Case ID | Description | Preconditions | Steps | Expected Result |
|--------------|-------------|---------------|-------|-----------------|
| `test_upload_file_to_ipfs` | Upload file to IPFS | Valid file | POST /ipfs/upload-file | 200 OK, ipfs_cid returned |
| `test_upload_json_to_ipfs` | Upload JSON metadata | Valid JSON | POST /ipfs/upload-json | 200 OK, ipfs_cid returned |
| `test_upload_file_pinata_failure` | Pinata pinning fails | Pinata mocked to fail | POST /ipfs/upload-file | 500 Error, upload failed |
| `test_upload_oversized_file` | Upload file >50MB | Large file | POST /ipfs/upload-file | 413 Payload Too Large |

---

## 3. Backend Service Layer Tests

### 3.1 NFT Service Tests (`test_nft_service.py`)

**Existing file:** `backend/tests/test_nft_service.py` - extends with:

#### Test Class: `TestNFTServiceMetadata`

| Test Case ID | Description |
|--------------|-------------|
| `test_generate_metadata_with_all_fields` | All asset fields present in metadata |
| `test_generate_metadata_with_inventors` | Multiple inventors as array |
| `test_generate_metadata_without_application_no` | Application number optional |
| `test_generate_metadata_primary_image_priority` | Primary attachment used for image |
| `test_generate_metadata_rights_declaration` | Rights declaration included |

#### Test Class: `TestNFTServiceStateTransitions`

| Test Case ID | Description | Preconditions | Expected Transition |
|--------------|-------------|---------------|---------------------|
| `test_status_draft_to_pending` | Submit for approval | DRAFT | PENDING |
| `test_status_pending_to_approved` | Approval passes | PENDING | APPROVED |
| `test_status_pending_to_rejected` | Approval fails | PENDING | REJECTED |
| `test_status_approved_to_minting` | Mint initiated | APPROVED | MINTING |
| `test_status_minting_to_minted` | Mint success | MINTING | MINTED |
| `test_status_minting_to_mint_failed` | Mint fails | MINTING | MINT_FAILED |
| `test_status_mint_failed_to_minting_retry` | Retry mint | MINT_FAILED | MINTING |

---

### 3.2 Approval Service Tests (`test_approval_service.py`)

**Existing file:** `backend/tests/test_approval_service.py` - extends with:

#### Test Class: `TestApprovalWorkflow`

| Test Case ID | Description |
|--------------|-------------|
| `test_approval_creates_approval_record` | Approval record created on submit |
| `test_approval_updates_asset_status` | Asset status updated on process |
| `test_approval_records_reviewer` | Reviewer ID recorded on process |
| `test_approval_records_timestamp` | Reviewed_at timestamp set |
| `test_approval_comment_stored` | Review comment stored |

#### Test Class: `TestApprovalPermissions`

| Test Case ID | Description |
|--------------|-------------|
| `test_owner_can_approve` | Enterprise owner can approve |
| `test_admin_can_approve` | Admin role can approve |
| `test_member_cannot_approve` | Member role forbidden |
| `test_viewer_cannot_approve` | Viewer role forbidden |

---

### 3.3 Ownership Service Tests (`test_ownership_service.py`)

**File to create:** `backend/tests/test_ownership_service.py`

#### Test Class: `TestOwnershipTransfer`

| Test Case ID | Description |
|--------------|-------------|
| `test_verify_transfer_permission_owner` | Owner can transfer |
| `test_verify_transfer_permission_admin` | Admin can transfer |
| `test_verify_transfer_permission_member` | Member cannot transfer |
| `test_sync_ownership_from_chain` | Ownership synced from blockchain events |

#### Test Class: `TestOwnershipHistory`

| Test Case ID | Description |
|--------------|-------------|
| `test_record_mint_ownership` | Mint creates ownership record |
| `test_record_transfer_ownership` | Transfer creates history entry |
| `test_get_ownership_timeline` | Timeline returned chronologically |

---

### 3.4 Asset Service Tests (`test_asset_service.py`)

**File to create:** `backend/tests/test_asset_service.py`

#### Test Class: `TestAssetHashVerification`

| Test Case ID | Description |
|--------------|-------------|
| `test_verify_file_hash_match` | SHA-256 hash matches client report |
| `test_verify_file_hash_mismatch` | Hash mismatch detected |
| `test_calculate_hash_of_file` | Server calculates correct hash |

---

## 4. Smart Contract Tests (Hardhat)

### 4.1 IPNFT Contract Tests (`contracts/test/IPNFT.test.ts`)

**Existing file:** `contracts/test/IPNFT.test.ts` - extends with:

#### Test Class: `TestIPNFTDeployment` (extends)

| Test Case ID | Description |
|--------------|-------------|
| `test_transfer_lock_time_initially_zero` | transferLockTime = 0 on deploy |
| `test_transfer_whitelist_initially_disabled` | transferWhitelistEnabled = false |

#### Test Class: `TestIPNFTBatchMinting`

| Test Case ID | Description |
|--------------|-------------|
| `test_batch_mint_creates_multiple_tokens` | 10 tokens created |
| `test_batch_mint_respects_50_limit` | Batch of 51 reverts |
| `test_batch_mint_allows_50` | Batch of exactly 50 succeeds |
| `test_batch_mint_empty_array_reverts` | Empty array reverts |
| `test_batch_mint_records_original_creator_all` | All tokens have same creator |
| `test_batch_mint_records_timestamps_all` | All tokens have timestamps |
| `test_batch_mint_emits_events_all` | NFTMinted emitted for each |

#### Test Class: `TestIPNFTTransferRestrictions`

| Test Case ID | Description |
|--------------|-------------|
| `test_transfer_lock_time_prevents_early_transfer` | Transfer before lock time reverts |
| `test_transfer_lock_time_allows_after_expiry` | Transfer after lock time succeeds |
| `test_transfer_lock_time_zero_allows_immediate` | Lock time = 0 allows immediate transfer |
| `test_transfer_whitelist_enabled_blocks_non_whitelisted` | Recipient not in whitelist reverts |
| `test_transfer_whitelist_enabled_allows_whitelisted` | Whitelisted recipient succeeds |
| `test_transfer_whitelist_disabled_allows_any` | Whitelist disabled = any recipient |

#### Test Class: `TestIPNFTTransferNFT`

| Test Case ID | Description |
|--------------|-------------|
| `test_transfer_nft_with_reason_emits_event` | NFTTransferredWithReason emitted |
| `test_transfer_nft_reason_empty_string` | Empty reason allowed |
| `test_transfer_nft_reason_stored_in_event` | Reason visible in event log |
| `test_transfer_nft_updates_owner` | ownerOf returns new owner |
| `test_transfer_nft_preserves_original_creator` | getOriginalCreator unchanged |

#### Test Class: `TestIPNFTMetadataLocking`

| Test Case ID | Description |
|--------------|-------------|
| `test_lock_metadata_by_non_creator_reverts` | Only creator can lock |
| `test_lock_metadata_emits_event` | MetadataLocked emitted |
| `test_lock_metadata_prevents_update` | updateTokenURI reverts after lock |
| `test_lock_metadata_cannot_be_unlocked` | Lock is permanent |
| `test_lock_metadata_already_locked_reverts` | Double lock reverts |
| `test_unlock_metadata_impossible` | No unlock function exists |

#### Test Class: `TestIPNFT RoyaltyLocking`

| Test Case ID | Description |
|--------------|-------------|
| `test_lock_royalty_by_non_creator_reverts` | Only creator can lock |
| `test_lock_royalty_emits_event` | RoyaltyLocked emitted |
| `test_lock_royalty_prevents_changes` | setTokenRoyalty reverts after lock |
| `test_lock_royalty_cannot_be_unlocked` | Lock is permanent |
| `test_lock_royalty_readable_after_lock` | royaltyInfo still readable |

#### Test Class: `TestIPNFTPausable`

| Test Case ID | Description |
|--------------|-------------|
| `test_pause_blocks_minting` | Mint reverts when paused |
| `test_pause_blocks_transfer` | transferFrom reverts when paused |
| `test_pause_blocks_transfer_nft` | transferNFT reverts when paused |
| `test_unpause_allows_operations` | Operations work after unpause |
| `test_only_owner_can_pause` | Non-owner pause reverts |
| `test_only_owner_can_unpause` | Non-owner unpause reverts |

#### Test Class: `TestIPNFTBurn`

| Test Case ID | Description |
|--------------|-------------|
| `test_burn_deletes_token` | Token no longer exists (ownerOf reverts) |
| `test_burn_clears_mint_timestamp` | mintTimestamp = 0 |
| `test_burn_clears_original_creator` | originalCreator = address(0) |
| `test_burn_clears_metadata_lock` | metadataLocked = false |
| `test_burn_clears_royalty_lock` | royaltyLocked = false |
| `test_burn_emits_nft_burned` | NFTBurned event emitted |
| `test_burn_by_non_owner_reverts` | Only owner/approved can burn |
| `test_burn_removes_from_enumeration` | tokenOfOwnerByIndex updated |

#### Test Class: `TestIPNFTEnumeration`

| Test Case ID | Description |
|--------------|-------------|
| `test_get_owner_token_ids_returns_all` | Returns all token IDs for owner |
| `test_get_owner_token_ids_empty_for_new_address` | New address has empty array |
| `test_token_by_index_out_of_bounds_reverts` | Invalid index reverts |
| `test_token_of_owner_by_index_out_of_bounds_reverts` | Invalid owner index reverts |

#### Test Class: `TestIPNFTViews`

| Test Case ID | Description |
|--------------|-------------|
| `test_get_next_token_id_increments` | getNextTokenId returns next ID |
| `test_is_metadata_locked_false_initially` | Unlocked token returns false |
| `test_is_royalty_locked_false_initially` | Unlocked royalty returns false |
| `test_token_uri_returns_metadata_uri` | tokenURI matches set URI |
| `test_royalty_info_zero_for_unset` | Unset royalty returns (0, 0) |

#### Test Class: `TestIPNFTInterfaceSupport`

| Test Case ID | Description |
|--------------|-------------|
| `test_supports_erc165_interface` | supportsInterface works |
| `test_does_not_support_random_interface` | Random interface returns false |

---

## 5. Integration Tests

### 5.1 Asset-to-NFT Lifecycle Test (`test_asset_nft_lifecycle.py`)

**File to create:** `backend/tests/test_asset_nft_lifecycle.py`

```
Test: Full asset lifecycle from creation to NFT minting

1. Create enterprise and user
2. Create asset with attachments
3. Submit asset for approval
4. Process approval (approve)
5. Mint NFT
6. Verify ownership record created
7. Verify mint record created
```

### 5.2 Approval Rejection Flow Test (`test_approval_rejection_flow.py`)

**File to create:** `backend/tests/test_approval_rejection_flow.py`

```
Test: Asset rejection and modification

1. Create asset
2. Submit for approval
3. Reject with reason
4. Verify asset status = REJECTED
5. Modify asset
6. Resubmit for approval
7. Approve
8. Mint NFT
```

### 5.3 NFT Transfer Integration Test (`test_nft_transfer_integration.py`)

**File to create:** `backend/tests/test_nft_transfer_integration.py`

```
Test: Cross-layer NFT transfer

1. Create enterprise, user, asset
2. Submit and approve asset
3. Mint NFT
4. Verify ownership on-chain
5. Transfer NFT to another address
6. Verify ownership updated on-chain
7. Verify ownership record updated in DB
```

### 5.4 Multi-Enterprise Isolation Test (`test_enterprise_isolation.py`)

**File to create:** `backend/tests/test_enterprise_isolation.py`

```
Test: Enterprises cannot access each other's assets

1. Create Enterprise A with User A
2. Create Enterprise B with User B
3. User A creates asset for Enterprise A
4. User B tries to access Enterprise A's asset
5. Verify 403 Forbidden
```

---

## 6. Test Data Fixtures

### 6.1 Shared Fixtures (`conftest.py`)

```python
# Enterprise fixtures
@pytest.fixture
async def enterprise(db_session):
    """Minimal enterprise for testing"""
    return Enterprise(id=uuid4(), name="Test Enterprise")

@pytest.fixture
async def enterprise_with_wallet(db_session):
    """Enterprise with blockchain wallet bound"""
    return Enterprise(wallet_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")

# User fixtures
@pytest.fixture
async def user(db_session, enterprise):
    """User bound to enterprise with ADMIN role"""
    return User(
        email="admin@test.com",
        username="testadmin",
        wallet_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    )

@pytest.fixture
async def viewer_user(db_session, enterprise):
    """User with VIEWER role"""
    return User(...), Member(role=MemberRole.VIEWER)

# Asset fixtures
@pytest.fixture
async def asset_draft(db_session, enterprise, user):
    """Asset in DRAFT status"""
    return Asset(status=AssetStatus.DRAFT, ...)

@pytest.fixture
async def asset_approved(db_session, enterprise, user):
    """Asset in APPROVED status with attachment"""
    return Asset(status=AssetStatus.APPROVED, ...)

@pytest.fixture
async def asset_with_attachments(db_session, enterprise, user):
    """Asset with multiple attachments"""
    # Creates asset + 3 attachments
    pass

# Contract fixtures
@pytest.fixture
def mock_ipfs_upload():
    """Mock IPFS upload returning success"""
    with patch('app.services.pinata_service.PinataService.upload_file') as mock:
        mock.return_value = {"IpfsHash": "QmTest123", ...}
        yield mock

@pytest.fixture
def mock_blockchain_mint():
    """Mock blockchain mint transaction"""
    with patch('app.core.blockchain.Web3Client.mint') as mock:
        mock.return_value = {"tokenId": 1, "txHash": "0x" + "1"*64}
        yield mock
```

### 6.2 Contract Test Fixtures

```typescript
// contracts/test/helpers.ts
export async function deployIPNFT() {
    const IPNFT = await ethers.getContractFactory("IPNFT");
    const ipnft = await IPNFT.deploy();
    await ipnft.waitForDeployment();
    return ipnft;
}

export const SAMPLE_METADATA = {
    name: "Test Patent",
    description: "A test patent for unit testing",
    image: "ipfs://QmTestImage",
    attributes: [
        { trait_type: "Asset Type", value: "Patent" },
        { trait_type: "Creator", value: "Test Creator" }
    ]
};
```

---

## Appendix A: Test Execution Commands

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_nft_service.py

# Run specific test class
pytest tests/test_nft_service.py::TestNFTServiceMintAsset

# Run tests matching pattern
pytest -k "test_mint"

# Run with verbose output
pytest -v

# Run async tests
pytest tests/test_approval_service.py -v
```

### Contract Tests

```bash
cd contracts

# Run all tests
npm run test

# Run specific test file
npx hardhat test test/IPNFT.test.ts

# Run with coverage
npm run test:coverage

# Run tests matching pattern
npx hardhat test --grep "mint"

# Run on specific network
npx hardhat test --network sepolia
```

---

## Appendix B: Test Data Constants

### Asset Types

```python
AssetType = {
    "PATENT": "Patent - 发明专利、实用新型、外观设计",
    "TRADEMARK": "Trademark - 商品商标、服务商标、集体商标",
    "COPYRIGHT": "Copyright - 软件著作权、文学艺术作品著作权",
    "TRADE_SECRET": "Trade Secret - 技术秘密、经营秘密",
    "DIGITAL_WORK": "Digital Work - NFT数字艺术、数字藏品"
}
```

### Legal Status

```python
LegalStatus = {
    "PENDING": "Application pending - 申请中",
    "GRANTED": "Authorized - 已授权",
    "EXPIRED": "Expired - 已过期",
    "REJECTED": "Rejected - 已驳回"
}
```

### Asset Status

```python
AssetStatus = {
    "DRAFT": "Draft - 草稿状态",
    "PENDING": "Pending Approval - 待审批",
    "APPROVED": "Approved - 审批通过",
    "MINTING": "Minting in Progress - 铸造中",
    "MINTED": "Minted - 已铸造",
    "REJECTED": "Rejected - 已拒绝",
    "MINT_FAILED": "Mint Failed - 铸造失败"
}
```

### Member Roles

```python
MemberRole = {
    "OWNER": "Enterprise Owner - 企业所有者",
    "ADMIN": "Administrator - 管理员",
    "MEMBER": "Member - 普通成员",
    "VIEWER": "Viewer - 观察者"
}
```

---

*Document generated based on 需求规格说明书.md and chapter-3-requirements.md*
