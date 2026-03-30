import { useNavigate } from "react-router-dom";
import {
    Container,
    Button,
    Typography,
    Box,
    AppBar,
    Toolbar,
    Fab,
    Grid,
    Card,
    CardContent
} from "@mui/material";
import { ChatBubbleOutline, LocalCafe, Star, AccessTime, EmojiFoodBeverage, Facebook, Instagram, Twitter, LinkedIn } from "@mui/icons-material";
import BackgroundDecor from "../components/BackgroundDecor";

function Home() {
    const navigate = useNavigate();

    const features = [
        { icon: <Star sx={{ fontSize: 40, color: "var(--color-secondary)" }} />, title: "Premium Quality", text: "Sourced from the finest plantations." },
        { icon: <AccessTime sx={{ fontSize: 40, color: "var(--color-secondary)" }} />, title: "24/7 Service", text: "Your coffee fix, anytime you need it." },
        { icon: <EmojiFoodBeverage sx={{ fontSize: 40, color: "var(--color-secondary)" }} />, title: "Rich Taste", text: "Experience the deep, robust flavors." },
    ];

    return (
        <Box sx={{ bgcolor: "var(--color-bg)", minHeight: "100vh", overflowX: "hidden" }}>
            <BackgroundDecor />

            {/* Hero Section */}
            <Box className="hero-section-animated" sx={{
                minHeight: "100vh",
                background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url('/hero-bg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden"
            }}>
                {/* Animated Smoke Overlay */}
                <div className="smoke-overlay"></div>

                {/* Navbar */}
                <AppBar position="static" color="transparent" elevation={0} sx={{ pt: 2, zIndex: 10 }}>
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
                            {/* Logo */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={() => navigate("/")} className="animate-fade-in">
                                <Box sx={{ bgcolor: "var(--color-secondary)", p: 0.8, borderRadius: "50%", display: "flex" }}>
                                    <LocalCafe sx={{ color: "var(--color-primary)" }} />
                                </Box>
                                <Typography variant="h6" sx={{ color: "white", fontFamily: "'Playfair Display', serif", letterSpacing: 1 }}>
                                    Coffee House
                                </Typography>
                            </Box>

                            {/* Nav Links */}
                            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4, alignItems: 'center' }} className="animate-fade-in delay-200">
                                {["HOME", "MENU", "RESERVATION"].map((item) => (
                                    <Typography
                                        key={item}
                                        className="nav-link"
                                        onClick={() => navigate("/")}
                                        sx={{
                                            color: "rgba(255,255,255,0.9)",
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            letterSpacing: "1.5px",
                                            cursor: "pointer",
                                            transition: "color 0.3s",
                                            "&:hover": { color: "var(--color-secondary)" }
                                        }}
                                    >
                                        {item}
                                    </Typography>
                                ))}
                                <Button
                                    onClick={() => navigate("/login")}
                                    sx={{
                                        color: "white",
                                        fontWeight: 600,
                                        fontSize: "0.85rem",
                                        "&:hover": { color: "var(--color-secondary)" }
                                    }}
                                >
                                    LOGIN
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/register")}
                                    sx={{
                                        bgcolor: "var(--color-secondary)",
                                        color: "var(--color-primary)",
                                        fontWeight: 700,
                                        borderRadius: "20px",
                                        px: 3,
                                        "&:hover": { bgcolor: "white" }
                                    }}
                                >
                                    SIGN UP
                                </Button>
                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>

                {/* Hero Content */}
                <Container maxWidth="lg" sx={{ flexGrow: 1, display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={10} lg={8} sx={{ textAlign: "center", mx: "auto" }}>
                            <Box className="animate-slide-up">
                                <Typography
                                    variant="h1"
                                    sx={{
                                        fontFamily: "'Playfair Display', serif",
                                        color: "var(--color-secondary)",
                                        fontSize: { xs: "4rem", md: "7rem", lg: "9rem" },
                                        lineHeight: 0.8,
                                        mb: 1,
                                        textShadow: "0px 10px 30px rgba(0,0,0,0.5)"
                                    }}
                                >
                                    Coffee
                                </Typography>
                                <Typography
                                    variant="h2"
                                    sx={{
                                        fontFamily: "'Playfair Display', serif",
                                        color: "white",
                                        fontSize: { xs: "2.5rem", md: "4rem", lg: "5rem" },
                                        fontStyle: "italic",
                                        mb: 4,
                                        fontWeight: 400
                                    }}
                                >
                                    House & Roastery
                                </Typography>
                                <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.8)", mb: 5, fontWeight: 300, maxWidth: "700px", mx: "auto" }}>
                                    Experience the art of coffee. Crafted with passion, brewed for perfection.
                                </Typography>

                                <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                                    <Button
                                        className="cta-pulse"
                                        variant="contained"
                                        onClick={() => navigate("/register")}
                                        sx={{
                                            borderRadius: "50px",
                                            px: 5,
                                            py: 1.5,
                                            fontSize: "1rem",
                                            bgcolor: "var(--color-secondary)",
                                            color: "var(--color-primary)",
                                            fontWeight: "bold",
                                            "&:hover": { bgcolor: "white", transform: "translateY(-3px)" },
                                            transition: "all 0.3s"
                                        }}
                                    >
                                        Create Account
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate("/login")}
                                        sx={{
                                            borderRadius: "50px",
                                            px: 4,
                                            py: 1.5,
                                            fontSize: "1rem",
                                            borderColor: "white",
                                            color: "white",
                                            backdropFilter: "blur(5px)",
                                            "&:hover": { borderColor: "var(--color-secondary)", color: "var(--color-secondary)", bgcolor: "rgba(255,255,255,0.05)" }
                                        }}
                                    >
                                        Our Story
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Box sx={{ py: 10, bgcolor: "var(--color-bg)" }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Card
                                    className="glass-card animate-slide-up"
                                    sx={{
                                        height: "100%",
                                        bgcolor: "white",
                                        textAlign: "center",
                                        py: 4,
                                        transition: "transform 0.3s",
                                        "&:hover": { transform: "translateY(-10px)" },
                                        animationDelay: `${index * 200}ms`
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                        <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", mb: 2, color: "var(--color-primary)" }}>
                                            {feature.title}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {feature.text}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* About Section */}
            <Box sx={{ py: 15, bgcolor: "var(--color-bg)", position: "relative", overflow: "hidden" }}>
                <Container maxWidth="lg">
                    <Grid container spacing={8} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box sx={{ position: "relative" }} className="animate-slide-up">
                                <Box
                                    component="img"
                                    src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
                                    alt="Coffee brewing"
                                    sx={{
                                        width: "100%",
                                        height: "auto",
                                        borderRadius: "50px 0 50px 0",
                                        boxShadow: "20px 20px 60px rgba(60, 42, 33, 0.15)",
                                        filter: "sepia(20%)"
                                    }}
                                />
                                <Box sx={{
                                    position: "absolute",
                                    bottom: -30,
                                    right: -30,
                                    width: "200px",
                                    height: "200px",
                                    bgcolor: "var(--color-secondary)",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "10px solid var(--color-bg)",
                                    zIndex: 1,
                                    display: { xs: "none", md: "flex" }
                                }}>
                                    <Typography variant="h4" sx={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                                        Est.<br />2024
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box className="animate-slide-up delay-200">
                                <Typography variant="overline" sx={{ color: "var(--color-secondary)", fontWeight: 800, letterSpacing: 3 }}>
                                    OUR STORY
                                </Typography>
                                <Typography variant="h2" sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: "var(--color-primary)",
                                    mb: 4,
                                    fontSize: { xs: "2.5rem", md: "3.5rem" }
                                }}>
                                    The Art of Perfect Brewing
                                </Typography>
                                <Typography sx={{ color: "text.secondary", mb: 3, lineHeight: 1.8, fontSize: "1.1rem" }}>
                                    At Coffee House, we believe every cup tells a story. From the high-altitude farms where our beans are hand-picked to the precise roasting process that brings out their unique character, we are dedicated to the art of coffee.
                                </Typography>
                                <Typography sx={{ color: "text.secondary", mb: 4, lineHeight: 1.8, fontSize: "1.1rem" }}>
                                    Our roastery in the heart of the city serves as a hub for coffee enthusiasts. We don't just brew coffee; we craft experiences that awaken your senses and warm your soul. Every morning, the aroma of freshly roasted beans fills our space, inviting you to slow down and savor the moment.
                                </Typography>

                                <Grid container spacing={4} sx={{ mb: 5 }}>
                                    <Grid item xs={4}>
                                        <Typography variant="h4" sx={{ color: "var(--color-secondary)", fontWeight: "bold" }}>20+</Typography>
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Coffee Blends</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="h4" sx={{ color: "var(--color-secondary)", fontWeight: "bold" }}>15k</Typography>
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Happy Clients</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="h4" sx={{ color: "var(--color-secondary)", fontWeight: "bold" }}>12</Typography>
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Awards Won</Typography>
                                    </Grid>
                                </Grid>

                                <Button
                                    variant="outlined"
                                    sx={{
                                        borderColor: "var(--color-primary)",
                                        color: "var(--color-primary)",
                                        borderRadius: "30px",
                                        px: 4,
                                        py: 1,
                                        transition: "all 0.3s",
                                        "&:hover": {
                                            bgcolor: "var(--color-primary)",
                                            color: "white",
                                            transform: "translateX(5px)"
                                        }
                                    }}
                                >
                                    Learn More
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>

                {/* Decorative floating bean in background */}
                <Box sx={{
                    position: "absolute",
                    top: "10%",
                    right: "-5%",
                    opacity: 0.05,
                    transform: "rotate(25deg)",
                    zIndex: 0,
                    display: { xs: "none", md: "block" }
                }}>
                    <LocalCafe sx={{ fontSize: "400px" }} />
                </Box>
            </Box>

            {/* CTA Section */}
            <Box sx={{ py: 10, position: "relative" }}>
                <Container maxWidth="md">
                    <Box sx={{
                        bgcolor: "var(--color-primary)",
                        borderRadius: "40px",
                        p: { xs: 6, md: 10 },
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                    }}>
                        {/* Background subtle image */}
                        <Box sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: "url('https://images.unsplash.com/photo-1497933322465-0472439b5173?q=80&w=2070&auto=format&fit=crop')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.2,
                            zIndex: 0
                        }} />

                        <Box sx={{ position: "relative", zIndex: 1 }}>
                            <Typography variant="h3" sx={{ color: "white", mb: 2, fontFamily: "'Playfair Display', serif" }}>
                                Taste the Magic in Every Sip
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.8)", mb: 5, fontSize: "1.1rem" }}>
                                Join our community of coffee lovers and discover your new favorite brew today.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => navigate("/register")}
                                sx={{
                                    bgcolor: "var(--color-secondary)",
                                    color: "var(--color-primary)",
                                    fontWeight: "bold",
                                    px: 6,
                                    py: 2,
                                    borderRadius: "50px",
                                    fontSize: "1.1rem",
                                    "&:hover": { bgcolor: "white", transform: "scale(1.05)" },
                                    transition: "all 0.3s"
                                }}
                            >
                                Get Started Now
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Footer Section */}
            <Box sx={{ bgcolor: "var(--color-primary)", color: "white", pt: 10, pb: 4 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={6}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                                <Box sx={{ bgcolor: "var(--color-secondary)", p: 0.8, borderRadius: "50%", display: "flex" }}>
                                    <LocalCafe sx={{ color: "var(--color-primary)" }} />
                                </Box>
                                <Typography variant="h6" sx={{ color: "white", fontFamily: "'Playfair Display', serif", letterSpacing: 1 }}>
                                    Coffee House
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 4, maxWidth: "300px" }}>
                                Crafting the finest coffee experiences since 2024. Join us in our journey of flavor and passion.
                            </Typography>
                            <Box sx={{ display: "flex", gap: 2 }}>
                                {[Facebook, Instagram, Twitter, LinkedIn].map((Icon, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            bgcolor: "rgba(255,255,255,0.05)",
                                            p: 1,
                                            borderRadius: "50%",
                                            display: "flex",
                                            cursor: "pointer",
                                            transition: "all 0.3s",
                                            "&:hover": { bgcolor: "var(--color-secondary)", transform: "translateY(-5px)" }
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 20 }} />
                                    </Box>
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>Quick Links</Typography>
                            {["Home", "Menu", "About", "Contact"].map((link) => (
                                <Typography key={link} sx={{ color: "rgba(255,255,255,0.7)", mb: 1.5, cursor: "pointer", "&:hover": { color: "var(--color-secondary)" } }}>
                                    {link}
                                </Typography>
                            ))}
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>Services</Typography>
                            {["Roastery", "Cafe", "Delivery", "Events"].map((service) => (
                                <Typography key={service} sx={{ color: "rgba(255,255,255,0.7)", mb: 1.5, cursor: "pointer", "&:hover": { color: "var(--color-secondary)" } }}>
                                    {service}
                                </Typography>
                            ))}
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 8, pt: 4, borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
                            © 2024 Coffee House. All rights reserved. Crafted with ❤️ for coffee lovers.
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Floating Chat Button */}
            <Fab
                sx={{
                    position: "fixed",
                    bottom: 30,
                    right: 30,
                    bgcolor: "var(--color-secondary)",
                    color: "white",
                    "&:hover": { bgcolor: "white", color: "var(--color-secondary)" },
                    zIndex: 100
                }}
            >
                <ChatBubbleOutline />
            </Fab>
        </Box>
    );
}

export default Home;
