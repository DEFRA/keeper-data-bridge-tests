import axios from "axios";
import { apiKey, healthEndpoint } from "./apiEndpoints.js";

export async function apiHealthCheck(url) {
    const apiHealthCheckResponse = await axios.get(url + healthEndpoint, {
        headers: {
            "x-api-key": apiKey,
        },
    });
    return apiHealthCheckResponse;
}