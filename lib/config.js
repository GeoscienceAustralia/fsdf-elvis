var config = {
   sa: {
      xmlTemplate: "http://elevation.fsdf.org.au/data/gazetteer/sa/${id}.xml"
   },

   fmeToken: {
      tokenUrl: "https://elevation.fsdf.org.au/token",  // Need the DEV server to be running for this to work.
      region: "ap-southeast-2",
      secretName: "fsdf/apps/fmecloud_token"
   },

   validHosts: [
      "localhost",
      "qldspatial.information.qld.gov.au",
      ".ga.gov.au",
      ".motogp.com",
      "elvis2018-ga.fmecloud.com",
      "s3-ap-southeast-2.amazonaws.com"
   ],

   positioning: {
      uploadUrl: "https://elvis2018-ga.fmecloud.com/fmerest/v2/resources/connections/FME_SHAREDRESOURCE_DATA/filesys/GDA2020/UPLOADS?createDirectories=false&overwrite=true",
      transformUrl: "https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_positioning/GDA94to2020Manager.fmw?opt_showresult=false&opt_servicemode=sync"
   },

   placenames: {
      downloadUrl: "https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_placenames/Placenames_ClipZipShip_Master.fmw?opt_responseformat=json&opt_showresult=false&opt_servicemode=sync"
   },

   elevation: {
      nameValuePair: process.env.ELEVATION_SERVICE_KEY_VALUE,
      recaptchaPrivateKey: process.env.ELEVATION_RECAPTCHA_PRIVATE_KEY,
      useElvis: true,
      elvisTemplate: "https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&polygon=${polygon}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&out_grid_name=${filename}&industry=${industry}&opt_showresult=false&opt_servicemode=async&opt_responseformat=json",
      postProcessingUrl: "https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/ZipDownloadablesPOST.fmw?opt_showresult=false&opt_servicemode=async&opt_responseformat=json",
      elevationTemplate: "https://elvis2018-ga.fmecloud.com/fmedatastreaming/elvis_tools/ELVIS_GetElevationAtPoint.fmw?pt_lat=${pt_lat}&pt_long=${pt_long}"
   },

   secrets: {
      region: "ap-southeast-2",
      secretName: "fsdf/apps/google",  
      googleKey: process.env.ELEVATION_SERVICE_KEY_VALUE,
      recaptchaPrivateKey: process.env.ELEVATION_RECAPTCHA_PRIVATE_KEY
   },
   isDev: process.env.FSDF_DEV_ENV // Set this in your local environment variables so that you can run locally.
};

module.exports = config;
