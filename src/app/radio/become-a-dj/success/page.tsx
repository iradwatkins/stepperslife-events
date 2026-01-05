import { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RadioSubNav } from "@/components/layout/RadioSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Radio, ArrowRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Application Submitted | SteppersLife Radio",
  description: "Your DJ application has been submitted successfully.",
};

export default function ApplicationSuccessPage() {
  return (
    <>
      <PublicHeader />
      <RadioSubNav />

      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-3">
                  Application Submitted!
                </h1>

                <p className="text-muted-foreground mb-6">
                  Thank you for applying to become a SteppersLife Radio DJ.
                  We'll review your application and get back to you within 48 hours.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 text-left">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Check Your Email</p>
                      <p className="text-xs text-muted-foreground">
                        We'll send you an email when your application is approved with
                        your station login credentials.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/radio">
                    <Button className="w-full gap-2">
                      <Radio className="w-4 h-4" />
                      Back to Radio
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full gap-2">
                      Go to Home
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
