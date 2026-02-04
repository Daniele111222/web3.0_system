
import pytest
from pydantic import ValidationError
from app.schemas.auth import UserLoginRequest, UserRegisterRequest

def test_login_password_length_validation():
    # 测试正常密码
    valid_data = {
        "email": "test@example.com",
        "password": "valid_password"
    }
    req = UserLoginRequest(**valid_data)
    assert req.password == "valid_password"

    # 测试超长密码 (73 bytes)
    long_password = "a" * 73
    invalid_data = {
        "email": "test@example.com",
        "password": long_password
    }
    with pytest.raises(ValidationError) as exc_info:
        UserLoginRequest(**invalid_data)
    
    assert "密码长度不能超过 72 字节" in str(exc_info.value)

def test_login_password_utf8_length():
    # 测试包含多字节字符的密码
    # "密码" 每个字 3 字节，共 6 字节。
    # 我们需要构造一个 len(str) < 72 但 len(utf8) > 72 的情况
    
    # 25 个汉字 = 75 字节
    chinese_password = "汉" * 25
    assert len(chinese_password) == 25
    assert len(chinese_password.encode('utf-8')) == 75
    
    invalid_data = {
        "email": "test@example.com",
        "password": chinese_password
    }
    with pytest.raises(ValidationError) as exc_info:
        UserLoginRequest(**invalid_data)
        
    assert "密码长度不能超过 72 字节" in str(exc_info.value)

def test_register_password_length_validation():
    # 顺便验证注册请求的限制
    long_password = "A" + "a" * 70 + "1!" # 73 chars
    
    # 构造一个符合其他规则但超长的密码
    # 注意：UserRegisterRequest 要求 min_length=8, max_length=128
    # 同时也要求包含大写、小写、数字、特殊字符
    
    # 构造一个合法的强密码，但长度超标 (例如 73 字节)
    # "A" + "a"*68 + "1!" = 1+68+2 = 71 chars -> 71 bytes (OK)
    # "A" + "a"*70 + "1!" = 73 chars -> 73 bytes (Fail)
    
    password = "A" + "a" * 70 + "1!"
    assert len(password) == 73
    
    invalid_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": password,
        "full_name": "Test User"
    }
    
    with pytest.raises(ValidationError) as exc_info:
        UserRegisterRequest(**invalid_data)
        
    assert "密码长度不能超过 72 字节" in str(exc_info.value)
