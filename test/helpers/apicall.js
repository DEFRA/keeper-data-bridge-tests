import axios from "axios";
import { apiKey, healthEndpoint } from "./apiEndpoints.js";
 


export async function apiHealthCheck(url) {
    console.log("Checking health endpoint at:", url + healthEndpoint);
    console.log(process.env);
    const apiHealthCheckResponse = await axios.get(url + healthEndpoint, {
        headers: {
            "x-api-key": apiKey
        }
    });
    return apiHealthCheckResponse;
}