import Rollbar from "rollbar";

const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
      code_version: '1.0.0',
    },
    autoInstrument: {
      network: true, // enable/disable network and log capture independently
      log: true 
    }
});

export default rollbar;