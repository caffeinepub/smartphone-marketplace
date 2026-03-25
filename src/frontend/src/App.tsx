import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Inbox,
  Info,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useMessageNotifications, useUnreadCount } from "./hooks/useQueries";
import { AboutPage } from "./pages/AboutPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { BrowsePage } from "./pages/BrowsePage";
import { LandingPage } from "./pages/LandingPage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { MessagesPage } from "./pages/MessagesPage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { SellPage } from "./pages/SellPage";
import { SignInPage } from "./pages/SignInPage";

type Page =
  | { name: "landing" }
  | { name: "browse" }
  | { name: "detail"; id: string }
  | { name: "sell" }
  | { name: "edit"; id: string }
  | { name: "my-listings" }
  | { name: "admin" }
  | { name: "messages" }
  | { name: "signin" }
  | { name: "about" };

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function App() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const isAuthenticated = !!identity;
  const [page, setPage] = useState<Page>({ name: "landing" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const { data: unreadCountBigInt } = useUnreadCount();
  const unreadCount = unreadCountBigInt ? Number(unreadCountBigInt) : 0;

  useMessageNotifications(() => navigate({ name: "messages" }));

  // Check admin status whenever identity or actor changes
  useEffect(() => {
    if (!actor || actorFetching || !identity) {
      setIsAdminUser(false);
      return;
    }
    actor
      .isAdmin()
      .then(setIsAdminUser)
      .catch(() => setIsAdminUser(false));
  }, [actor, actorFetching, identity]);

  const navigate = (p: Page) => {
    setPage(p);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    // Redirect already-authenticated users away from sign-in page
    if (page.name === "signin" && isAuthenticated) {
      return (
        <BrowsePage onViewListing={(id) => navigate({ name: "detail", id })} />
      );
    }

    switch (page.name) {
      case "signin":
        return (
          <SignInPage
            onLogin={login}
            isLoggingIn={isLoggingIn}
            onBack={() => navigate({ name: "landing" })}
          />
        );
      case "landing":
        return (
          <LandingPage
            onBrowse={() => navigate({ name: "browse" })}
            onSell={() => navigate({ name: "sell" })}
          />
        );
      case "browse":
        return (
          <BrowsePage
            onViewListing={(id) => navigate({ name: "detail", id })}
          />
        );
      case "detail":
        return (
          <ListingDetailPage
            listingId={page.id}
            onBack={() => navigate({ name: "browse" })}
            onEdit={(id) => navigate({ name: "edit", id })}
            onNavigateToMessages={() => navigate({ name: "messages" })}
          />
        );
      case "sell":
        return (
          <SellPage
            onSuccess={() => navigate({ name: "browse" })}
            onBack={() => navigate({ name: "browse" })}
          />
        );
      case "edit":
        return (
          <SellPage
            editId={page.id}
            onSuccess={() => navigate({ name: "my-listings" })}
            onBack={() => navigate({ name: "my-listings" })}
          />
        );
      case "my-listings":
        return (
          <MyListingsPage
            onSell={() => navigate({ name: "sell" })}
            onEdit={(id) => navigate({ name: "edit", id })}
            onView={(id) => navigate({ name: "detail", id })}
            onLogin={login}
          />
        );
      case "admin":
        return <AdminDashboardPage />;
      case "messages":
        return (
          <MessagesPage
            onViewListing={(id) => navigate({ name: "detail", id })}
            onLogin={login}
          />
        );
      case "about":
        return <AboutPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            data-ocid="nav.logo.button"
            className="flex items-center gap-2 font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
            onClick={() => navigate({ name: "landing" })}
          >
            <img
              src="/assets/uploads/logo-transparent-1.png"
              alt="PhoneBazaar"
              className="h-8 w-auto object-contain"
            />
          </button>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant={page.name === "browse" ? "secondary" : "ghost"}
              size="sm"
              data-ocid="nav.browse.link"
              onClick={() => navigate({ name: "browse" })}
            >
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              Browse
            </Button>
            <Button
              variant={page.name === "about" ? "secondary" : "ghost"}
              size="sm"
              data-ocid="nav.about.link"
              onClick={() => navigate({ name: "about" })}
            >
              <Info className="h-4 w-4 mr-1.5" />
              About
            </Button>
            <Button
              variant={page.name === "sell" ? "secondary" : "ghost"}
              size="sm"
              data-ocid="nav.sell.link"
              onClick={() => navigate({ name: "sell" })}
            >
              <Tag className="h-4 w-4 mr-1.5" />
              Sell
            </Button>
            {isAuthenticated && (
              <Button
                variant={page.name === "my-listings" ? "secondary" : "ghost"}
                size="sm"
                data-ocid="nav.my_listings.link"
                onClick={() => navigate({ name: "my-listings" })}
              >
                <User className="h-4 w-4 mr-1.5" />
                My Listings
              </Button>
            )}
            {isAuthenticated && (
              <div className="relative">
                <Button
                  variant={page.name === "messages" ? "secondary" : "ghost"}
                  size="sm"
                  data-ocid="nav.inbox.link"
                  onClick={() => navigate({ name: "messages" })}
                >
                  <Inbox className="h-4 w-4 mr-1.5" />
                  Inbox
                </Button>
                <UnreadBadge count={unreadCount} />
              </div>
            )}
            {isAuthenticated && isAdminUser && (
              <Button
                variant={page.name === "admin" ? "secondary" : "ghost"}
                size="sm"
                data-ocid="nav.admin.link"
                onClick={() => navigate({ name: "admin" })}
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Admin
              </Button>
            )}

            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                data-ocid="nav.logout.button"
                onClick={clear}
                className="ml-2"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign Out
              </Button>
            ) : (
              <Button
                size="sm"
                data-ocid="nav.login.button"
                onClick={() => navigate({ name: "signin" })}
                className="ml-2"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            data-ocid="nav.mobile_menu.button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </nav>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-t border-border bg-background"
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                <Button
                  variant={page.name === "browse" ? "secondary" : "ghost"}
                  size="sm"
                  className="justify-start"
                  data-ocid="nav.mobile.browse.link"
                  onClick={() => navigate({ name: "browse" })}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse
                </Button>
                <Button
                  variant={page.name === "about" ? "secondary" : "ghost"}
                  size="sm"
                  className="justify-start"
                  data-ocid="nav.mobile.about.link"
                  onClick={() => navigate({ name: "about" })}
                >
                  <Info className="h-4 w-4 mr-2" />
                  About
                </Button>
                <Button
                  variant={page.name === "sell" ? "secondary" : "ghost"}
                  size="sm"
                  className="justify-start"
                  data-ocid="nav.mobile.sell.link"
                  onClick={() => navigate({ name: "sell" })}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Sell
                </Button>
                {isAuthenticated && (
                  <Button
                    variant={
                      page.name === "my-listings" ? "secondary" : "ghost"
                    }
                    size="sm"
                    className="justify-start"
                    data-ocid="nav.mobile.my_listings.link"
                    onClick={() => navigate({ name: "my-listings" })}
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Listings
                  </Button>
                )}
                {isAuthenticated && (
                  <div className="relative w-full">
                    <Button
                      variant={page.name === "messages" ? "secondary" : "ghost"}
                      size="sm"
                      className="justify-start w-full"
                      data-ocid="nav.mobile.inbox.link"
                      onClick={() => navigate({ name: "messages" })}
                    >
                      <Inbox className="h-4 w-4 mr-2" />
                      Inbox
                      {unreadCount > 0 && (
                        <span className="ml-auto h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1.5 leading-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </div>
                )}
                {isAuthenticated && isAdminUser && (
                  <Button
                    variant={page.name === "admin" ? "secondary" : "ghost"}
                    size="sm"
                    className="justify-start"
                    data-ocid="nav.mobile.admin.link"
                    onClick={() => navigate({ name: "admin" })}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
                <div className="pt-2 border-t border-border mt-1">
                  {isAuthenticated ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start w-full"
                      data-ocid="nav.mobile.logout.button"
                      onClick={clear}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      data-ocid="nav.mobile.login.button"
                      onClick={() => navigate({ name: "signin" })}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={page.name + ("id" in page ? page.id : "")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">
              PhoneBazaar
            </span>
            <span className="text-muted-foreground/50">·</span>
            <button
              type="button"
              data-ocid="footer.about.link"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              onClick={() => navigate({ name: "about" })}
            >
              About
            </button>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <p className="text-xs text-muted-foreground">
              Owned by{" "}
              <span className="font-semibold text-foreground">
                Ali Haider Aftab
              </span>{" "}
              &middot;{" "}
              <span className="font-semibold text-foreground">
                KMZ INTERACTIVE
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PhoneBazaar. Built with ♥ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}
