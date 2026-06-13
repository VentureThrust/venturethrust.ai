// nodemailer ships without bundled TypeScript declarations, and
// @types/nodemailer isn't installed. Declare it as an untyped module so the
// server routes that use it (api/contact, api/notify-question-answer) type-check
// cleanly instead of raising TS7016.
declare module 'nodemailer';
