const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = path.join(this.logDir, `mint-${Date.now()}.log`);
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  writeToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }

  info(message) {
    console.log(chalk.blue(`ℹ ${message}`));
    this.writeToFile(`INFO: ${message}`);
  }

  success(message) {
    console.log(chalk.green(`✓ ${message}`));
    this.writeToFile(`SUCCESS: ${message}`);
  }

  error(message) {
    console.log(chalk.red(`✗ ${message}`));
    this.writeToFile(`ERROR: ${message}`);
  }

  warning(message) {
    console.log(chalk.yellow(`⚠ ${message}`));
    this.writeToFile(`WARNING: ${message}`);
  }

  debug(message) {
    if (process.env.DEBUG === 'true') {
      console.log(chalk.gray(`🐛 ${message}`));
      this.writeToFile(`DEBUG: ${message}`);
    }
  }

  transaction(txHash, status, details = '') {
    const message = `TX ${txHash} - ${status} ${details}`;
    if (status === 'SUCCESS') {
      this.success(message);
    } else {
      this.error(message);
    }
  }

  banner(text) {
    const line = '='.repeat(60);
    console.log(chalk.cyan('\n' + line));
    console.log(chalk.cyan.bold(text.padStart((60 + text.length) / 2)));
    console.log(chalk.cyan(line + '\n'));
  }
}

module.exports = new Logger();
