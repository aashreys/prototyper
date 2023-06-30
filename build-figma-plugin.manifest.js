module.exports = function (manifest) {
  return {
    ...manifest,
    networkAccess: {
      allowedDomains: [
        "none"
      ]
    }
  }
}