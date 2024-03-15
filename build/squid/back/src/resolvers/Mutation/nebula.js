"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nebula_1 = require("../../nebula");
const installNebula = (root, { isLighthouse, lighthouseNebulaIp, lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, lighthousePublicEndpoint, name, version, allowReinstall }) => {
    return nebula_1.nebula.install({ isLighthouse, lighthouseNebulaIp, lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, lighthousePublicEndpoint, name, version, allowReinstall });
};
