const ApiExtractor = require("@microsoft/api-extractor")

const config = {
  $schema: "https://developer.microsoft.com/json-schemas/api-extractor/api-extractor.schema.json",
  compiler: {
    configType: "tsconfig",
    rootFolder: "./"
  },
  project: {
    entryPointSourceFile: "dist-ts/index.d.ts"
  },
  validationRules: {
    missingReleaseTags: "allow"
  },
  dtsRollup: {
    enabled: true,
    publishFolder: "./",
    mainDtsRollupPath: "dist/index.d.ts"
  },
  apiReviewFile: {
    enabled: false
  },
  apiJsonFile: {
    enabled: false
  }
}

// This interface provides additional runtime state that is NOT part of the config file
const options = {
  // localBuild: process.argv.indexOf("--ship") < 0
}
const extractor = new ApiExtractor.Extractor(config, options)
extractor.processProject()
