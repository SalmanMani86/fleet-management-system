import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 4001);

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Fleet Management API listening on http://localhost:${PORT}`);
});
