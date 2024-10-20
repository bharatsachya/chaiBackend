class ApiError extends Error {
  constructor(
    message="Internal Server Error", 
    statusCode,
    errors=[],
    stack = ""
) {
    super(message);
    this.statusCode = statusCode;
    this.data = null
    this.nessage = message
    this.success = false
    this.errors = errors
    if(stack){
        this.stack = stack
    }
    else{
        Error.captureStackTrace(this, this.constructor)
    }
  }
}

export  {ApiError};