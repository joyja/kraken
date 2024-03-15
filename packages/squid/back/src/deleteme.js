const { exec } = require('child_process')

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      resolve(stdout)
      if (err) {
        // reject(err)
      } else {
      }
    })
  })
}

const run = async () => {
  const result = await runCommand('systemctl is-active squid')
  console.log(result)
}

run()