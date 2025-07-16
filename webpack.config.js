const {
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");
const moduleFederationConfig = withModuleFederationPlugin({

      name: 'appointments',
      exposes: {
        './AppointmentsModule': './src/app/appointments/appointment.module.ts',
      },
      shared: {
       ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
      }
    })
 
moduleFederationConfig.output.publicPath = "http://localhost:5000/";
module.exports = moduleFederationConfig;
