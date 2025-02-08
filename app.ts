import cookieParser from "cookie-parser";
import express from "express";

const app = express();

app.use('/static', express.static('static'))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

export default app;