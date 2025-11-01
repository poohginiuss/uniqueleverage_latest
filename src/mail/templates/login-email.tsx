import { Container, Html, Preview } from "@react-email/components";
import { Body } from "../components/body";
import { Button } from "../components/button";
import { LeftAligned as Footer } from "../components/footer";
import { Head } from "../components/head";
import { LeftAligned as Header } from "../components/header";
import { Tailwind } from "../components/tailwind";
import { Text } from "../components/text";

export default function LoginEmail({ 
  loginUrl, 
  firstName 
}: { 
  loginUrl: string;
  firstName: string;
}) {
  return (
    <Html>
      <Tailwind theme="light">
        <Head />
        <Preview>Sign in to Unique Leverage</Preview>
        <Body>
          <Container align="center" className="w-full max-w-160 bg-primary md:p-8">
            <Header />
            <Container align="left" className="max-w-full px-6 py-8">
              <Text className="text-md text-tertiary">
                Hi {firstName},
                <br />
                <br />
                Click the button below to sign in to your <span className="text-md font-semibold">Unique Leverage</span> account.
              </Text>
              <Button href={loginUrl} className="my-6">
                <Text className="text-md font-semibold">Sign in to Unique Leverage</Text>
              </Button>
              <Text className="text-md text-tertiary">
                This link can only be used once and is valid for 30 minutes.
                <br />
                <br />
                If you didn't request this email, you can safely ignore it.
                <br />
                <br />
                Thanks,
                <br />
                The Unique Leverage Team
              </Text>
            </Container>
            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
