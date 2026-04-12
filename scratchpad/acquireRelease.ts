import { Config, Effect, Layer, Redacted, Schema, Context } from "effect";
import * as NodeMailer from "nodemailer";

export class SmtpError extends Schema.ErrorClass<SmtpError>("SmtpError")({
  cause: Schema.Defect,
}) {}

export class Smtp extends Context.Service<
  Smtp,
  {
    send(message: {
      readonly to: string;
      readonly subject: string;
      readonly body: string;
    }): Effect.Effect<void, SmtpError>;
  }
>()("app/Smtp") {
  static readonly layer = Layer.effect(
    Smtp,
    Effect.gen(function* () {
      const user = yield* Config.string("SMTP_USER");
      const pass = yield* Config.redacted("SMTP_PASS");

      const transporter = yield* Effect.acquireRelease(
        Effect.sync(() =>
          NodeMailer.createTransport({
            host: "smtp.example.com",
            port: 587,
            secure: false,
            auth: { user, pass: Redacted.value(pass) },
          }),
        ),
        (transporter) => Effect.sync(() => transporter.close()),
      );

      const send = Effect.fn("Smtp.send")(
        (message: {
          readonly to: string;
          readonly subject: string;
          readonly body: string;
        }) =>
          Effect.tryPromise({
            try: () =>
              transporter.sendMail({
                from: "Acme Cloud <cloud@acme.com>",
                to: message.to,
                subject: message.subject,
                text: message.body,
              }),
            catch: (cause) => new SmtpError({ cause }),
          }).pipe(Effect.asVoid),
      );

      return Smtp.of({ send });
    }),
  );
}

class MailerError extends Schema.TaggedErrorClass<MailerError>()(
  "MailerError",
  {
    reason: SmtpError,
  },
) {}

export class Mailer extends Context.Service<
  Mailer,
  {
    sendWelcomeEmail(to: string): Effect.Effect<void, MailerError>;
  }
>()("app/Mailer") {
  static readonly layerNoDeps = Layer.effect(
    Mailer,
    Effect.gen(function* () {
      const smtp = yield* Smtp;

      const sendWelcomeEmail = Effect.fn("Mailer.sendWelcomeEmail")(function* (
        to: string,
      ) {
        yield* smtp
          .send({
            to,
            subject: "welcome to Acme Cloud",
            body: "Thanks for signing up for Acme Cloud. We're glad to have you!",
          })
          .pipe(Effect.mapError((reason) => new MailerError({ reason })));
        yield* Effect.logInfo(`Sent welcome email to ${to}`);
      });

      return Mailer.of({ sendWelcomeEmail });
    }),
  );

  static readonly layer = this.layerNoDeps.pipe(Layer.provide(Smtp.layer));
}
