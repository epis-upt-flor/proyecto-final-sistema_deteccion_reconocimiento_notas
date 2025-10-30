from abc import ABC, abstractmethod
from typing import Optional
from .entities import UserAuth

class AuthRepository(ABC):
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[UserAuth]:
        pass
    
    @abstractmethod
    def get_by_email(self, email: str) -> Optional[UserAuth]:
        pass
    
    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[UserAuth]:
        pass
    
    @abstractmethod
    def create(self, user_auth: UserAuth) -> UserAuth:
        pass
    
    @abstractmethod
    def update(self, user_auth: UserAuth) -> UserAuth:
        pass
    
    @abstractmethod
    def username_exists(self, username: str) -> bool:
        pass
    
    @abstractmethod
    def email_exists(self, email: str) -> bool:
        pass