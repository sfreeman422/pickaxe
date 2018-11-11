const { exec } = require("child_process");
/**
 * Executes the specified command as a child process.
 *
 * @param {*} command
 */
function executeChild(command, options, ignoreError) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout) => {
      if (error && !ignoreError) {
        reject(error);
      } else resolve(stdout);
    });
  });
}

module.exports = executeChild;
