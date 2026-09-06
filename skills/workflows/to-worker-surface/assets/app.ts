import { readFile } from "node:fs/promises";
import Fastify from "fastify";
import { contract } from "./contract";
import { renderContract } from "./render";

export function buildApp() {
	const app = Fastify({ logger: false });
	app.get("/", async (_request, reply) =>
		reply.type("text/html; charset=utf-8").send(renderContract(contract)),
	);
	app.get("/reference.css", async (_request, reply) =>
		reply
			.type("text/css; charset=utf-8")
			.send(
				await readFile(
					new URL("../public/reference.css", import.meta.url),
					"utf8",
				),
			),
	);
	return app;
}
