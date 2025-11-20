import { expect } from "chai"; 
import { describe, it } from "mocha";
import { apiHealthCheck } from "../helpers/apicall.js";
import { keeperDataBridgeEphemeralUrl, keeperDataAPIEphemeralUrl, keeperDataBridgeUrl, keeperDataAPIUrl } from "../helpers/apiEndpoints.js";




describe("API Health Check", () => {
    it("should return status 200 for ls-keeper-data-bridge-backend health check endpoint", async () => {
        const response = await apiHealthCheck(keeperDataBridgeEphemeralUrl);
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
        expect(response.status).to.equal(200); 
    });
    
    it("should return status 200 for ls-keeper-data-api health check endpoint", async () => {
        const response = await apiHealthCheck(keeperDataAPIEphemeralUrl);
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
        expect(response.status).to.equal(200); 
    });
});
