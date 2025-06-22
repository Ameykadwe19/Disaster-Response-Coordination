class Logger {
  static log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...metadata
    };
    
    console.log(JSON.stringify(logEntry));
  }

  static info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  static error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  static warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  static debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }
}

module.exports = Logger;