import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/cloudflare-workers';

import { RealtimeClient } from '@openai/realtime-api-beta';

const app = new Hono<{ Bindings: Env }>();

app.get(
	'/relay',
	upgradeWebSocket(async (c) => {
		// NOTE: This is because of the check for WebSocket (Workers has it and looks like a browser!)
		const dangerouslyAllowAPIKeyInBrowser = true;
		const client = new RealtimeClient({ apiKey: c.env.OPENAI_API_KEY, dangerouslyAllowAPIKeyInBrowser });
		const messageQueue: Array<{ data: string }> = [];
		function handleMessage(evt: { data: string }) {
			try {
				const event = JSON.parse(evt.data);
				console.log(`Relaying "${event.type}" to OpenAI`);
				client.realtime.send(event.type, event);
			} catch (err) {
				console.error(err);
				console.log(`Error parsing event from client: ${evt.data}`);
			}
		}
		return {
			async onOpen(evt, ws) {
				console.log('Opened');
				// Relay: OpenAI Realtime API Event -> Browser Event
				client.realtime.on('server.*', (event: { type: string }) => {
					console.log(`Relaying "${event.type}" to Client`);
					ws.send(JSON.stringify(event));
				});
				client.realtime.on('close', () => ws.close());

				// Connect to OpenAI Realtime API
				try {
					console.log(`Connecting to OpenAI...`);
					await client.connect();
				} catch (err) {
					console.log(`Error connecting to OpenAI: ${err}`);
					ws.close();
					return;
				}
				console.log(`Connected to OpenAI successfully!`);
				while (messageQueue.length) {
					handleMessage(messageQueue.shift() as {data: string});
				}
			},
			onMessage(evt, ws) {
				console.log('Message received');
				if (!client.isConnected()) {
					console.log('Queueing...client not ready');
					messageQueue.push(evt);
					return;
				}
				handleMessage(evt);
			},
			onClose(evt, ws) {
				console.log('Closing');
			},
		};
	})
);

export default app;
