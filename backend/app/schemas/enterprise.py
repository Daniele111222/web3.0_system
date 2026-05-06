"""Enterprise-related request and response schemas."""

from datetime import datetime
import re
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enterprise import MemberRole


EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


class EnterpriseCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=100, description="Enterprise name")
    description: Optional[str] = Field(None, max_length=1000, description="Enterprise description")
    logo_url: Optional[str] = Field(None, max_length=500, description="Enterprise logo URL")
    website: Optional[str] = Field(None, max_length=255, description="Enterprise website")
    contact_email: Optional[str] = Field(
        None,
        max_length=255,
        description="Contact email",
        alias="contactEmail",
    )
    address: Optional[str] = Field(None, max_length=500, description="Enterprise address")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Enterprise name cannot be empty")
        return value

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            return None
        if not re.match(r"^https?://", value):
            raise ValueError("Website must start with http:// or https://")
        return value

    @field_validator("contact_email")
    @classmethod
    def validate_contact_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip().lower()
        if not value:
            return None
        if not re.match(EMAIL_REGEX, value):
            raise ValueError("Invalid email format")
        return value


class EnterpriseUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Enterprise name")
    description: Optional[str] = Field(None, max_length=1000, description="Enterprise description")
    logo_url: Optional[str] = Field(None, max_length=500, description="Enterprise logo URL")
    website: Optional[str] = Field(None, max_length=255, description="Enterprise website")
    contact_email: Optional[str] = Field(
        None,
        max_length=255,
        description="Contact email",
        alias="contactEmail",
    )
    address: Optional[str] = Field(None, max_length=500, description="Enterprise address")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Enterprise name cannot be empty")
        return value

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            return None
        if not re.match(r"^https?://", value):
            raise ValueError("Website must start with http:// or https://")
        return value

    @field_validator("contact_email")
    @classmethod
    def validate_contact_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip().lower()
        if not value:
            return None
        if not re.match(EMAIL_REGEX, value):
            raise ValueError("Invalid email format")
        return value


class MemberResponse(BaseModel):
    id: str = Field(..., description="Member relation ID")
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="User email")
    full_name: Optional[str] = Field(None, description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    role: MemberRole = Field(..., description="Member role")
    joined_at: datetime = Field(..., description="Joined at")

    class Config:
        from_attributes = True


class EnterpriseResponse(BaseModel):
    id: str = Field(..., description="Enterprise ID")
    name: str = Field(..., description="Enterprise name")
    description: Optional[str] = Field(None, description="Enterprise description")
    logo_url: Optional[str] = Field(None, description="Enterprise logo URL")
    website: Optional[str] = Field(None, description="Enterprise website")
    contact_email: Optional[str] = Field(None, description="Contact email")
    address: Optional[str] = Field(None, description="Enterprise address")
    wallet_address: Optional[str] = Field(None, description="Wallet address")
    is_active: bool = Field(..., description="Active flag")
    is_verified: bool = Field(..., description="Verified flag")
    created_at: datetime = Field(..., description="Created at")
    updated_at: datetime = Field(..., description="Updated at")
    member_count: int = Field(default=0, description="Member count")

    class Config:
        from_attributes = True


class EnterpriseDetailResponse(EnterpriseResponse):
    members: List[MemberResponse] = Field(default_factory=list, description="Members")


class EnterpriseListResponse(BaseModel):
    items: List[EnterpriseResponse] = Field(..., description="Enterprise list")
    total: int = Field(..., description="Total count")
    page: int = Field(..., description="Page number")
    page_size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total pages")


class BoundWalletEnterpriseResponse(BaseModel):
    enterprise_id: str = Field(..., description="Enterprise ID")
    enterprise_name: str = Field(..., description="Enterprise name")
    wallet_address: str = Field(..., description="Bound wallet address")
    is_active: bool = Field(..., description="Active flag")
    is_verified: bool = Field(..., description="Verified flag")
    member_count: int = Field(default=0, description="Member count")


class InviteMemberRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Invited user ID")
    email: Optional[str] = Field(None, max_length=255, description="Invited user email")
    role: MemberRole = Field(default=MemberRole.MEMBER, description="Member role")

    @model_validator(mode="after")
    def validate_invitee(self) -> "InviteMemberRequest":
        if not self.user_id and not self.email:
            raise ValueError("Either user_id or email is required")
        return self

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip().lower()
        if not value:
            return None
        if not re.match(EMAIL_REGEX, value):
            raise ValueError("Invalid email format")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: MemberRole) -> MemberRole:
        if value == MemberRole.OWNER:
            raise ValueError("Cannot invite a member as owner")
        return value


class UpdateMemberRoleRequest(BaseModel):
    role: MemberRole = Field(..., description="New member role")

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: MemberRole) -> MemberRole:
        if value == MemberRole.OWNER:
            raise ValueError("Cannot promote a member to owner")
        return value


class WalletBindChallengeRequest(BaseModel):
    wallet_address: str = Field(
        ...,
        min_length=42,
        max_length=42,
        description="Ethereum wallet address",
    )

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet_address(cls, value: str) -> str:
        if not re.match(r"^0x[a-fA-F0-9]{40}$", value):
            raise ValueError("Invalid Ethereum wallet address")
        return value.lower()


class WalletBindChallengeResponse(BaseModel):
    challenge_token: str = Field(..., description="One-time bind challenge token")
    wallet_address: str = Field(..., description="Ethereum wallet address")
    message: str = Field(..., description="Message to be signed")
    expires_at: datetime = Field(..., description="Challenge expiration time")


class BindWalletRequest(BaseModel):
    wallet_address: str = Field(
        ...,
        min_length=42,
        max_length=42,
        description="Ethereum wallet address",
    )
    signature: str = Field(..., description="Signature payload")
    challenge_token: str = Field(..., min_length=16, description="One-time bind challenge token")

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet_address(cls, value: str) -> str:
        if not re.match(r"^0x[a-fA-F0-9]{40}$", value):
            raise ValueError("Invalid Ethereum wallet address")
        return value.lower()
