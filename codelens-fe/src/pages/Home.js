import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import Grid from "@mui/material/Grid";  
import { useNavigate } from "react-router-dom";
import HomeData from "../utils/Helpers";

const Home = () => {
  const navigate = useNavigate();
  const cards = HomeData(navigate);

  return (
    <Box className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <Container className="home-hero-container">
          <Typography variant="h3" className="home-hero-title">
            CodeLens for Cloud
          </Typography>
          <Typography variant="body1" className="home-hero-subtitle">
            Generate, review, and secure Terraform with an AI copilot. Connect
            your repos, scan for issues, and ship with confidence.
          </Typography>
          <div className="home-hero-cta">
            <Button
              className="home-btn primary"
              onClick={() => navigate("/chat-start")}
            >
              Start a Chat
            </Button>
            <Button
              className="home-btn secondary"
              onClick={() => navigate("/scan-repo")}
            >
              Scan a Repository
            </Button>
          </div>
        </Container>
      </section>

      {/* Action Cards */}
      <section className="home-actions">
        <Grid container spacing={3} className="home-actions-grid">
          {cards.map((card, idx) => (
            <Grid
              key={idx}
              size={{ xs: 12, md: 5 }}
              sx={{ display: "flex" }}
            >
              <Card className="home-card" sx={{ width: "100%" }}>
                <CardContent className="home-card-content">
                  <div className="home-card-icon">{card.icon}</div>
                  <Typography variant="h6" className="home-card-title">
                    {card.title}
                  </Typography>
                  <Typography className="home-card-text">
                    {card.text}
                  </Typography>
                </CardContent>
                <CardActions className="home-card-actions">
                  {card.buttons.map((btn, bIdx) => (
                    <Button
                      key={bIdx}
                      className="home-btn small"
                      onClick={btn.action}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </section>
    </Box>
  );
};

export default Home;
