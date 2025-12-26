"""Custom exceptions for solver."""
from typing import Optional


class SolverException(Exception):
    """Base exception for solver errors."""
    def __init__(self, message: str, details: Optional[str] = None):
        self.message = message
        self.details = details
        super().__init__(message)


class InfeasibleError(SolverException):
    """Raised when no solution exists."""
    pass


class SolverTimeoutError(SolverException):
    """Raised when solver times out."""
    pass


class ValidationError(SolverException):
    """Raised for input validation errors."""
    pass


class ConfigurationError(SolverException):
    """Raised for configuration issues."""
    pass
