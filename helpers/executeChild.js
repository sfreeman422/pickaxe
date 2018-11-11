const { exec } = require("child_process");
/**
 * Executes the specified command as a child process.
 *
 * @param {*} command
 */
function executeChild(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, error => {
      if (error) {
        reject(new Error(`Failed execution of ${command} with ${error}`));
      } else resolve(`Successfully executed ${command}`);
    });
  });
}

module.exports = executeChild;
