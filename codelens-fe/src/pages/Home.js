import React from "react";
import { useNavigate } from "react-router-dom";
import HomeData from "../utils/Helpers";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Scan } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const cards = HomeData(navigate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            CodeLens for Cloud
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Generate, review, and secure Terraform with an AI copilot. Connect
            your repos, scan for issues, and ship with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate("/scan-repo")}
            >
              <Scan className="h-4 w-4" />
              Scan a Repository
            </Button>
          </div>
        </div>
      </section>

      {/* Action Cards */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
              <Card key={idx} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardContent className="flex-1 pt-6">
                  <div className="mb-4">{card.icon}</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {card.text}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 pt-0">
                  {card.buttons.map((btn, bIdx) => (
                    <Button
                      key={bIdx}
                      variant={bIdx === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={btn.action}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
