class APIError(Exception):
    def __init__(self, message, status=400, code='invalid_request', retry_after=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.retry_after = retry_after
