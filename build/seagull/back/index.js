"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const twilio_1 = __importDefault(require("twilio"));
const cors = require('cors');
const bodyParser = __importStar(require("body-parser"));
const app = (0, express_1.default)();
app.use(cors());
// Use the Twilio middleware to parse request bodies
app.use(express_1.default.json());
// For parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
const calls = {};
const verificationCalls = {};
const url = process.env.SEAGULL_URL || 'https://seagull.anywherescada.com';
// Endpoint to initiate the outbound call
app.post('/make-call', async (req, res) => {
    const toNumber = req.body.to;
    const message = req.body.message;
    const mantleId = req.body.mantleId;
    const rosterId = req.body.rosterId;
    if (!toNumber || !message || !mantleId || !rosterId) {
        return res.status(400).send("Please provide a 'to' number, 'message', mantleId, and rosterId in the request body.");
    }
    const client = (0, twilio_1.default)(process.env.SEAGULL_TWILIO_ACCOUNT_SID, process.env.SEAGULL_TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
        url: `${url}/handle-response`, // Use the generated TwiML directly
        to: toNumber,
        from: '+18559043932'
    })
        .catch(error => {
        console.error(error);
        res.status(500).send(error.message);
    });
    if (call) {
        calls[call.sid] = { mantleId, rosterId, message };
    }
    res.status(200).send('Call incoming!');
});
// Endpoint to handle the response after the call is answered
app.post('/handle-response', (req, res) => {
    const callSid = req.body.CallSid;
    const { message } = calls[callSid];
    const twiml = new VoiceResponse();
    const gather = twiml.gather({
        numDigits: 1,
        action: '/handle-key'
    });
    gather.say(`${message} Press 1 to acknowledge.`);
    twiml.redirect('/handle-response');
    res.type('text/xml');
    res.send(twiml.toString());
});
// Endpoint to handle the key press
app.post('/handle-key', async (req, res) => {
    const callSid = req.body.CallSid;
    const { mantleId, rosterId } = calls[callSid];
    const twiml = new VoiceResponse();
    if (req.body.Digits === '1') {
        twiml.say('You pressed 1. Performing action now.');
        const mutation = `mutation AcknowledgeRoster($id: String!) {
				acknowledgeRoster(id: $id) {
						id
				}
			}`;
        const mantleUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:4000/graphql' : `http://mantle-${mantleId}.anywherescada.svc.cluster.local:4000/graphql`;
        const res = await fetch(mantleUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: mutation,
                variables: {
                    id: rosterId
                }
            })
        });
        console.log(await res.json());
    }
    else {
        twiml.say('Thank you for your input. Goodbye!');
    }
    res.type('text/xml');
    res.send(twiml.toString());
});
// Endpoint to handle verification calls
app.post('/send-verification', async (req, res) => {
    const number = req.body.number;
    const code = req.body.code;
    const userId = req.body.userId;
    const method = req.body.method;
    if (!number || !userId || !code) {
        return res.status(400).send("Please provide a 'number', 'code' and a 'userid' in the request body.");
    }
    console.log(url);
    const client = (0, twilio_1.default)(process.env.SEAGULL_TWILIO_ACCOUNT_SID, process.env.SEAGULL_TWILIO_AUTH_TOKEN);
    if (method === 'call') {
        const call = await client.calls.create({
            url: `${url}/handle-verification-response`, // Use the generated TwiML directly
            to: number,
            from: '+18559043932'
        })
            .catch(error => {
            console.error(error);
            res.status(500).send(error.message);
        });
        if (call) {
            verificationCalls[call.sid] = { userId, number, code };
        }
        res.status(200).send('Call incoming!');
    }
    else if (method === 'text') {
        const message = await client.messages.create({
            body: `Hello from anywherescada.com! Your verification code is ${code}`,
            to: number,
            from: '+18559043932'
        })
            .catch(error => {
            console.error(error);
            res.status(500).send(error.message);
        });
        res.status(200).send('Message Sent');
    }
});
// Endpoint to handle the response after the verification call is answered
app.post('/handle-verification-response', (req, res) => {
    const callSid = req.body.CallSid;
    const { code } = verificationCalls[callSid];
    const twiml = new VoiceResponse();
    const preparedCode = code.split('').join(' ');
    twiml.say(`Your code is ${preparedCode}. Please enter it at anywhere scada now and hang up when finished.`);
    twiml.redirect('/handle-verification-response');
    res.type('text/xml');
    res.send(twiml.toString());
});
// Endpoint to handle SMS notification
app.post('/send-sms', async (req, res) => {
    const toNumber = req.body.to;
    const message = req.body.message;
    const mantleId = req.body.mantleId;
    const rosterId = req.body.rosterId;
    if (!toNumber || !message || !mantleId || !rosterId) {
        return res.status(400).send("Please provide a 'to' number, 'message', mantleId, and rosterId in the request body.");
    }
    const client = (0, twilio_1.default)(process.env.SEAGULL_TWILIO_ACCOUNT_SID, process.env.SEAGULL_TWILIO_AUTH_TOKEN);
    const sms = await client.messages.create({
        body: `${message}. Please acknowledge at https://anywherescada.com/console/space/${mantleId}/rosters/`,
        to: toNumber,
        from: '+18559043932'
    })
        .catch(error => {
        console.error(error);
        res.status(500).send(error.message);
    });
    res.status(200).send('SMS Sent!');
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
