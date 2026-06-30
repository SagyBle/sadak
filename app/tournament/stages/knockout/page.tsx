"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TournamentFrontendService from "@/app/frontendServices/tournament.frontendService";
import KnockoutFrontendService from "@/app/frontendServices/knockout.frontendService";
import MatchFrontendService from "@/app/frontendServices/match.frontendService";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  ArrowLeft,
  Trash2,
  AlertCircle,
  Trophy,
  Target,
  Edit,
  Search,
} from "lucide-react";

interface Tournament {
  _id: string;
  name: string;
  description: string;
  players: any[];
  status: string;
}

interface Match {
  _id: string;
  player1: { _id: string; name: string; phoneNumber: string } | null;
  player2: { _id: string; name: string; phoneNumber: string } | null;
  player1Score: number;
  player2Score: number;
  winner: { _id: string; name: string } | null;
  status: string;
  round: number;
  roundName: string;
  bracketPosition: number;
  nextMatchId: string | null;
  gambling?: {
    votes: Array<{
      sessionId: string;
      votedFor: "player1" | "player2";
      timestamp: Date;
    }>;
    player1Votes: number;
    player2Votes: number;
  };
}

function KnockoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tournamentId = searchParams.get("tournamentId");
  const { isAdmin, logout } = useAuth();

  // Get current full URL for redirect
  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matchesByRound, setMatchesByRound] = useState<{
    [key: number]: Match[];
  }>({});
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [updatingScore, setUpdatingScore] = useState(false);
  const [creatingNextRound, setCreatingNextRound] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showAddMatchDialog, setShowAddMatchDialog] = useState(false);
  const [selectedRound, setSelectedRound] = useState<{
    round: number;
    roundName: string;
  } | null>(null);
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>("");
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>("");
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [matchToCancel, setMatchToCancel] = useState<Match | null>(null);
  const [togglingCancel, setTogglingCancel] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [votingMatchId, setVotingMatchId] = useState<string | null>(null);
  const [showResetGamblingDialog, setShowResetGamblingDialog] = useState(false);
  const [matchToResetGambling, setMatchToResetGambling] =
    useState<Match | null>(null);
  const [resettingGambling, setResettingGambling] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchKnockoutMatches();
    } else {
      setLoading(false);
    }
  }, [tournamentId]);

  // Initialize session ID for gambling
  useEffect(() => {
    let storedSessionId = localStorage.getItem("gambling_session_id");
    if (!storedSessionId) {
      // Generate UUID
      storedSessionId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("gambling_session_id", storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const deadline = new Date("2025-12-21T16:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeRemaining({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchTournament = async () => {
    try {
      const response = await TournamentFrontendService.getTournamentById(
        tournamentId!
      );
      if (response.success && response.data) {
        setTournament(response.data as Tournament);
      } else {
        toast.error("הטורניר לא נמצא");
        router.push("/tournament/register");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const fetchKnockoutMatches = async () => {
    try {
      const response = await KnockoutFrontendService.getKnockoutMatches(
        tournamentId!
      );
      if (response.success && response.data) {
        const data = response.data as any;
        setMatchesByRound(data.matchesByRound || {});
        setAllMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Error fetching knockout matches:", error);
    }
  };

  const handleCreateBracket = async () => {
    setCreating(true);
    try {
      const response = await KnockoutFrontendService.createBracket({
        tournamentId: tournamentId!,
      });

      if (response.success) {
        toast.success("הברקט נוצר בהצלחה!");
        await fetchKnockoutMatches();
      } else {
        toast.error(response.error || "נכשל ביצירת ברקט");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBracket = async () => {
    setDeleting(true);
    try {
      const response = await KnockoutFrontendService.deleteKnockout(
        tournamentId!
      );

      if (response.success) {
        toast.success("הברקט נמחק");
        setMatchesByRound({});
        setAllMatches([]);
        setShowDeleteDialog(false);
      } else {
        toast.error(response.error || "נכשל במחיקת ברקט");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenScoreDialog = (match: Match) => {
    setSelectedMatch(match);
    setPlayer1Score(match.player1Score || 0);
    setPlayer2Score(match.player2Score || 0);
    setShowScoreDialog(true);
  };

  const handleUpdateScore = async () => {
    if (!selectedMatch) return;

    setUpdatingScore(true);
    try {
      const response = await MatchFrontendService.updateScore({
        matchId: selectedMatch._id,
        player1Score,
        player2Score,
      });

      if (response.success) {
        toast.success("התוצאה עודכנה בהצלחה!");
        await fetchKnockoutMatches();
        setShowScoreDialog(false);
      } else {
        toast.error(response.error || "נכשל בעדכון תוצאה");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setUpdatingScore(false);
    }
  };

  const handleCreateNextRound = async () => {
    setCreatingNextRound(true);
    try {
      const response = await KnockoutFrontendService.createNextRound({
        tournamentId: tournamentId!,
      });

      if (response.success) {
        toast.success("השלב הבא נוצר בהצלחה!");

        // Show warning if there's a player without opponent
        const data = response.data as any;
        if (data?.warning) {
          toast.warning(data.warning, { duration: 6000 });
        }

        await fetchKnockoutMatches();
      } else {
        toast.error(response.error || "נכשל ביצירת השלב הבא");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setCreatingNextRound(false);
    }
  };

  const handleOpenAddMatchDialog = (round: number, roundName: string) => {
    setSelectedRound({ round, roundName });
    setSelectedPlayer1("");
    setSelectedPlayer2("");
    setShowAddMatchDialog(true);
  };

  const handleCreateCustomMatch = async () => {
    if (!selectedPlayer1 || !selectedPlayer2 || !selectedRound) {
      toast.error("יש לבחור שני שחקנים");
      return;
    }

    if (selectedPlayer1 === selectedPlayer2) {
      toast.error("לא ניתן ליצור משחק עם אותו שחקן");
      return;
    }

    setCreatingMatch(true);
    try {
      const response = await MatchFrontendService.createCustomMatch({
        tournamentId: tournamentId!,
        player1Id: selectedPlayer1,
        player2Id: selectedPlayer2,
        round: selectedRound.round,
        roundName: selectedRound.roundName,
      });

      if (response.success) {
        toast.success("המשחק נוסף בהצלחה!");
        await fetchKnockoutMatches();
        setShowAddMatchDialog(false);
      } else {
        toast.error(response.error || "נכשל ביצירת משחק");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setCreatingMatch(false);
    }
  };

  // Get available players for custom match (not in non-cancelled matches in the selected round)
  const getAvailablePlayers = () => {
    if (!selectedRound || !tournament?.players) return [];

    // Only exclude players from non-cancelled matches
    const playersInRound = (matchesByRound[selectedRound.round] || [])
      .filter((match) => match.status !== "CANCELLED")
      .flatMap((match) => [match.player1?._id, match.player2?._id].filter(Boolean));

    return tournament.players.filter(
      (player: any) => !playersInRound.includes(player._id)
    );
  };

  const handleOpenCancelDialog = (match: Match) => {
    setMatchToCancel(match);
    setShowCancelDialog(true);
  };

  const handleToggleCancelled = async () => {
    if (!matchToCancel) return;

    const isCancelling = matchToCancel.status !== "CANCELLED";

    setTogglingCancel(true);
    try {
      const response = await MatchFrontendService.toggleCancelled({
        matchId: matchToCancel._id,
        cancelled: isCancelling,
      });

      if (response.success) {
        const message = isCancelling
          ? "המשחק בוטל בהצלחה"
          : "המשחק שוחזר בהצלחה";
        toast.success(message);

        // Show warning if there's one
        const data = response.data as any;
        if (data?.warning) {
          toast.warning(data.warning, { duration: 5000 });
        }

        await fetchKnockoutMatches();
        setShowCancelDialog(false);
      } else {
        toast.error(response.error || "נכשל בביטול משחק");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setTogglingCancel(false);
    }
  };

  const handleVote = async (
    matchId: string,
    votedFor: "player1" | "player2"
  ) => {
    if (!sessionId) return;

    setVotingMatchId(matchId);
    try {
      const response = await MatchFrontendService.vote({
        matchId,
        sessionId,
        votedFor,
      });

      if (response.success) {
        toast.success("ההימור נרשם בהצלחה!");
        await fetchKnockoutMatches();
      } else {
        toast.error(response.error || "נכשל ברישום הימור");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setVotingMatchId(null);
    }
  };

  const getUserVote = (match: Match): "player1" | "player2" | null => {
    if (!match.gambling || !sessionId) return null;

    const userVote = match.gambling.votes.find(
      (vote) => vote.sessionId === sessionId
    );
    return userVote ? userVote.votedFor : null;
  };

  const getVotePercentages = (match: Match | null) => {
    if (!match || !match.gambling) return { player1: 0, player2: 0, total: 0 };

    const player1Votes = match.gambling.player1Votes || 0;
    const player2Votes = match.gambling.player2Votes || 0;
    const total = player1Votes + player2Votes;

    if (total === 0) return { player1: 0, player2: 0, total: 0 };

    const player1 = Math.round((player1Votes / total) * 100);
    const player2 = 100 - player1;

    return { player1, player2, total };
  };

  const handleOpenResetGamblingDialog = (match: Match) => {
    setMatchToResetGambling(match);
    setShowResetGamblingDialog(true);
  };

  const handleResetGambling = async () => {
    if (!matchToResetGambling) return;

    setResettingGambling(true);
    try {
      const response = await MatchFrontendService.resetGambling({
        matchId: matchToResetGambling._id,
      });

      if (response.success) {
        toast.success("ההימורים נמחקו בהצלחה!");
        await fetchKnockoutMatches();
        setShowResetGamblingDialog(false);
      } else {
        toast.error(response.error || "נכשל במחיקת הימורים");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setResettingGambling(false);
    }
  };

  // Filter matches based on search query
  const filterMatches = (matches: Match[]) => {
    if (!searchQuery.trim()) return matches;

    const searchTerms = searchQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    if (searchTerms.length === 0) return matches;

    return matches.filter((match) => {
      const player1Name = match.player1?.name?.toLowerCase() || "";
      const player2Name = match.player2?.name?.toLowerCase() || "";
      const combinedNames = `${player1Name} ${player2Name}`;

      // All search terms must be found in the combined player names
      return searchTerms.every((term) => combinedNames.includes(term));
    });
  };

  // Get filtered matches by round
  const getFilteredMatchesByRound = () => {
    if (!searchQuery.trim()) return matchesByRound;

    const filtered: { [key: number]: Match[] } = {};

    Object.keys(matchesByRound).forEach((roundNumStr) => {
      const roundNum = Number(roundNumStr);
      const filteredMatches = filterMatches(matchesByRound[roundNum]);
      if (filteredMatches.length > 0) {
        filtered[roundNum] = filteredMatches;
      }
    });

    return filtered;
  };

  if (!tournamentId) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        dir="rtl"
      >
        <Card className="max-w-md mx-3">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-3" />
            <p className="text-lg text-gray-600 mb-2">לא נבחר טורניר</p>
            <p className="text-sm text-gray-500 mb-4">
              אנא בחר טורניר מרשימת הטורנירים
            </p>
            <Link href="/tournament/register">
              <Button>חזרה לטורנירים</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roundNumbers = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  // Check if we can create the next round
  const canCreateNextRound = () => {
    if (roundNumbers.length === 0) return false;

    // Get the highest round
    const highestRound = Math.max(...roundNumbers);
    const highestRoundMatches = matchesByRound[highestRound] || [];

    // Check if all matches in the highest round are completed OR cancelled
    const allCompletedOrCancelled = highestRoundMatches.every(
      (m) => m.status === "COMPLETED" || m.status === "CANCELLED"
    );

    // Check if there are enough winners for another round (at least 2)
    // Only count winners from completed matches (cancelled matches have no winners)
    const winnersCount = highestRoundMatches.filter(
      (m) => m.status === "COMPLETED" && m.winner
    ).length;

    // Don't show button if this is already the final (only 1 match in the round)
    const isFinal = highestRoundMatches.length === 1;

    return allCompletedOrCancelled && winnersCount >= 2 && !isFinal;
  };

  const filteredMatchesByRound = getFilteredMatchesByRound();
  const filteredRoundNumbers = Object.keys(filteredMatchesByRound)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white fixed w-full top-0 z-50" dir="rtl">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9">
              <Image
                src="/icons/liviatan.png"
                alt="Leviathan Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              פינג פונג לוויתן
            </span>
          </Link>
          <div className="flex gap-2">
            {isAdmin ? (
              <>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">
                    מחובר כמנהל
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    logout();
                    toast.success("התנתקת בהצלחה");
                    window.location.reload();
                  }}
                  className="text-sm"
                >
                  התנתק
                </Button>
              </>
            ) : (
              <Link
                href={`/login?redirectTo=${encodeURIComponent(currentUrl)}`}
              >
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  כניסת מנהל
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-3 sm:px-4 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/tournament/register">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-sm"
              dir="rtl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              חזרה
            </Button>
          </Link>

          {loading ? (
            <div className="text-center py-12" dir="rtl">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-3 text-sm text-center">טוען...</p>
            </div>
          ) : (
            <>
              {/* Tournament Header */}
              <div
                className="bg-white rounded-lg p-4 sm:p-6 mb-4 border"
                dir="rtl"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-900 text-right">
                      {tournament?.name}
                    </h1>
                    <p className="text-sm text-gray-600 text-right">
                      שלב הנוקאאוט - {tournament?.players?.length || 0} שחקנים
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="relative w-6 h-6">
                      <Image
                        src="/icons/pingpong.jpg"
                        alt="Ping Pong"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              {allMatches.length > 0 && (
                <Card className="border mb-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                  <CardContent className="py-4" dir="rtl">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-orange-800 mb-2">
                        ⏰ זמן נותר לסיום כל המשחקים
                      </p>
                      <div className="flex justify-center gap-3 mb-2" dir="ltr">
                        <div className="bg-white rounded-lg p-2 min-w-[60px] shadow-sm">
                          <div className="text-2xl font-bold text-orange-600">
                            {timeRemaining.hours}
                          </div>
                          <div className="text-xs text-gray-600">שעות</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 min-w-[60px] shadow-sm">
                          <div className="text-2xl font-bold text-orange-600">
                            {timeRemaining.minutes}
                          </div>
                          <div className="text-xs text-gray-600">דקות</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 min-w-[60px] shadow-sm">
                          <div className="text-2xl font-bold text-orange-600">
                            {timeRemaining.seconds}
                          </div>
                          <div className="text-xs text-gray-600">שניות</div>
                        </div>
                      </div>
                      <p className="text-sm text-orange-700">
                        21/12/2025 בשעה 16:00
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Controls */}
              {allMatches.length === 0 ? (
                <>
                  {isAdmin ? (
                    <Card className="border mb-6">
                      <CardHeader className="pb-3" dir="rtl">
                        <CardTitle className="text-lg text-right">
                          יצירת ברקט נוקאאוט
                        </CardTitle>
                        <CardDescription className="text-sm text-right">
                          צור ברקט נוקאאוט עם התאמה אקראית של השחקנים
                        </CardDescription>
                      </CardHeader>
                      <CardContent dir="rtl">
                        <Button
                          onClick={handleCreateBracket}
                          disabled={creating || !tournament?.players?.length}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          {creating ? (
                            <span className="flex items-center gap-2">
                              <svg
                                className="animate-spin h-3.5 w-3.5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              יוצר ברקט...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              צור ברקט נוקאאוט
                              <Target className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border mb-6">
                      <CardContent className="py-12 text-center" dir="rtl">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <Image
                            src="/icons/pingpong.jpg"
                            alt="Ping Pong"
                            fill
                            className="object-contain opacity-50"
                          />
                        </div>
                        <p className="text-lg text-gray-700 mb-2 text-center">
                          מחכים לכלל השחקנים שירשמו
                        </p>
                        <p className="text-sm text-gray-500 text-center">
                          ואז נפרסם את לוח המשחקים!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  {/* Action Buttons */}
                  <div
                    className="flex justify-between items-center mb-4 gap-2"
                    dir="rtl"
                  >
                    {canCreateNextRound() && (
                      <Button
                        onClick={handleCreateNextRound}
                        disabled={creatingNextRound}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {creatingNextRound ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-3.5 w-3.5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            יוצר שלב הבא...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5" />
                            צור שלב הבא
                          </span>
                        )}
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="destructive"
                        size="sm"
                        className={canCreateNextRound() ? "" : "mr-auto"}
                      >
                        <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                        מחק ברקט
                      </Button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="mb-4" dir="rtl">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="חפש שחקנים... (לדוגמה: דוד משה)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 text-right"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        מציג משחקים המכילים: {searchQuery}
                      </p>
                    )}
                  </div>

                  {/* Bracket Display */}
                  <div className="space-y-6">
                    {filteredRoundNumbers.length === 0 ? (
                      <Card className="border">
                        <CardContent className="py-12 text-center">
                          <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-600 mb-2">לא נמצאו משחקים</p>
                          <p className="text-sm text-gray-500 mb-4">
                            נסה לחפש עם שמות אחרים
                          </p>
                          <Button
                            onClick={() => setSearchQuery("")}
                            variant="outline"
                            size="sm"
                          >
                            נקה חיפוש
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredRoundNumbers.map((roundNum, index) => {
                        const matches = filteredMatchesByRound[roundNum] || [];
                        const roundName =
                          matches[0]?.roundName || `סיבוב ${roundNum}`;

                        // Calculate opacity based on round importance (0 = most important/final)
                        const opacityValue = Math.max(0.5, 1 - index * 0.15);
                        const isEarlyRound = index > 1;

                        return (
                          <div
                            key={roundNum}
                            style={{ opacity: opacityValue }}
                            className={isEarlyRound ? "blur-[0.3px]" : ""}
                          >
                            <h2
                              className="text-lg sm:text-xl font-semibold mb-3 text-right"
                              dir="rtl"
                            >
                              {roundName === "Final"
                                ? "גמר"
                                : roundName === "Semi-finals"
                                ? "חצי גמר"
                                : roundName === "Quarter-finals"
                                ? "רבע גמר"
                                : roundName === "Round of 16"
                                ? "שמינית גמר"
                                : roundName}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {matches.map((match, index) => (
                                <Card
                                  key={match._id}
                                  className={`border ${
                                    match.status === "CANCELLED"
                                      ? "bg-gray-100 border-gray-300 opacity-60 blur-[0.5px]"
                                      : match.status === "COMPLETED"
                                      ? "bg-green-50 border-green-200"
                                      : match.status === "IN_PROGRESS"
                                      ? "bg-blue-50 border-blue-200"
                                      : "bg-white"
                                  }`}
                                >
                                  <CardContent className="p-4" dir="rtl">
                                    <div className="text-xs text-gray-500 mb-2 text-right">
                                      משחק {index + 1}
                                    </div>

                                    {/* Gambling Display - No votes yet message */}
                                    {match.status === "SCHEDULED" &&
                                      getVotePercentages(match).total === 0 && (
                                        <div className="mb-3 p-2 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg text-center">
                                          <span className="text-xs text-red-600 font-semibold">
                                            🔥 עוד לא נרשמו הימורים - היה
                                            הראשון!
                                          </span>
                                        </div>
                                      )}

                                    {/* Voting Buttons - show if votes exist or game is scheduled */}
                                    {(getVotePercentages(match).total > 0 ||
                                      match.status === "SCHEDULED") &&
                                      match.player1 &&
                                      match.player2 &&
                                      match.status !== "CANCELLED" && (
                                        <div
                                          className={`space-y-1 mb-3 p-3 rounded-lg ${
                                            match.status === "SCHEDULED"
                                              ? "bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-2 border-red-300 shadow-md"
                                              : "bg-gray-50 border border-gray-300"
                                          }`}
                                        >
                                          <div
                                            className={`text-xs font-bold text-center mb-2 ${
                                              match.status === "SCHEDULED"
                                                ? "text-red-700"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            <div className="flex items-center justify-center gap-1">
                                              {match.status === "SCHEDULED" ? (
                                                <>
                                                  <span>🔥</span>
                                                  <span>על מי אתם מהמרים?</span>
                                                  <span>🔥</span>
                                                </>
                                              ) : (
                                                <span>תוצאות הימורים</span>
                                              )}
                                            </div>
                                            {getVotePercentages(match).total >
                                              0 && (
                                              <div className="text-[10px] font-normal mt-1 opacity-75">
                                                סה"כ{" "}
                                                {
                                                  getVotePercentages(match)
                                                    .total
                                                }{" "}
                                                הימורים
                                              </div>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            <Button
                                              onClick={() =>
                                                handleVote(match._id, "player1")
                                              }
                                              disabled={
                                                match.status !== "SCHEDULED" ||
                                                votingMatchId === match._id
                                              }
                                              size="sm"
                                              variant={
                                                getUserVote(match) === "player1"
                                                  ? "default"
                                                  : "outline"
                                              }
                                              className={`text-xs font-semibold ${
                                                match.status === "SCHEDULED"
                                                  ? getUserVote(match) ===
                                                    "player1"
                                                    ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
                                                    : "bg-white hover:bg-red-50 border-red-300 text-red-700"
                                                  : "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                                              }`}
                                            >
                                              {match.player1?.name}
                                              {getVotePercentages(match).total >
                                                0 && (
                                                <span className="text-[10px] opacity-80 ml-1">
                                                  (
                                                  {
                                                    getVotePercentages(match)
                                                      .player1
                                                  }
                                                  %)
                                                </span>
                                              )}
                                            </Button>
                                            <Button
                                              onClick={() =>
                                                handleVote(match._id, "player2")
                                              }
                                              disabled={
                                                match.status !== "SCHEDULED" ||
                                                votingMatchId === match._id
                                              }
                                              size="sm"
                                              variant={
                                                getUserVote(match) === "player2"
                                                  ? "default"
                                                  : "outline"
                                              }
                                              className={`text-xs font-semibold ${
                                                match.status === "SCHEDULED"
                                                  ? getUserVote(match) ===
                                                    "player2"
                                                    ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
                                                    : "bg-white hover:bg-red-50 border-red-300 text-red-700"
                                                  : "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                                              }`}
                                            >
                                              {match.player2?.name}
                                              {getVotePercentages(match).total >
                                                0 && (
                                                <span className="text-[10px] opacity-80 ml-1">
                                                  (
                                                  {
                                                    getVotePercentages(match)
                                                      .player2
                                                  }
                                                  %)
                                                </span>
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                    {/* Player 1 */}
                                    <div
                                      className={`flex items-center justify-between p-2 rounded mb-2 ${
                                        match.winner?._id === match.player1?._id
                                          ? "bg-green-100 border border-green-300"
                                          : "bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex-1 text-right">
                                        <span
                                          className={
                                            match.winner?._id ===
                                            match.player1?._id
                                              ? "font-bold"
                                              : ""
                                          }
                                        >
                                          {match.player1?.name || "ממתין..."}
                                        </span>
                                      </div>
                                      {match.status === "COMPLETED" && (
                                        <span className="font-semibold ml-2">
                                          {match.player1Score}
                                        </span>
                                      )}
                                    </div>

                                    {/* VS Divider */}
                                    <div className="text-center text-xs text-gray-500 my-1">
                                      vs
                                    </div>

                                    {/* Player 2 */}
                                    <div
                                      className={`flex items-center justify-between p-2 rounded ${
                                        match.winner?._id === match.player2?._id
                                          ? "bg-green-100 border border-green-300"
                                          : "bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex-1 text-right">
                                        <span
                                          className={
                                            match.winner?._id ===
                                            match.player2?._id
                                              ? "font-bold"
                                              : ""
                                          }
                                        >
                                          {match.player2?.name || "ממתין..."}
                                        </span>
                                      </div>
                                      {match.status === "COMPLETED" && (
                                        <span className="font-semibold ml-2">
                                          {match.player2Score}
                                        </span>
                                      )}
                                    </div>

                                    {/* Status Badge and Admin Buttons */}
                                    <div className="mt-3 space-y-2">
                                      <div className="text-center">
                                        <span
                                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                                            match.status === "CANCELLED"
                                              ? "bg-gray-200 text-gray-700"
                                              : match.status === "COMPLETED"
                                              ? "bg-green-100 text-green-700"
                                              : match.status === "IN_PROGRESS"
                                              ? "bg-blue-100 text-blue-700"
                                              : "bg-gray-100 text-gray-600"
                                          }`}
                                        >
                                          {match.status === "CANCELLED"
                                            ? "❌ בוטל"
                                            : match.status === "COMPLETED"
                                            ? "הסתיים"
                                            : match.status === "IN_PROGRESS"
                                            ? "בתהליך"
                                            : "ממתין"}
                                        </span>
                                      </div>
                                      {isAdmin &&
                                        match.player1 &&
                                        match.player2 && (
                                          <>
                                            <Button
                                              onClick={() =>
                                                handleOpenCancelDialog(match)
                                              }
                                              size="sm"
                                              variant={
                                                match.status === "CANCELLED"
                                                  ? "default"
                                                  : "destructive"
                                              }
                                              className="w-full text-xs"
                                            >
                                              {match.status === "CANCELLED"
                                                ? "שחזר משחק"
                                                : "בטל משחק"}
                                            </Button>
                                            {getVotePercentages(match).total >
                                              0 && (
                                              <Button
                                                onClick={() =>
                                                  handleOpenResetGamblingDialog(
                                                    match
                                                  )
                                                }
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-xs text-red-600 border-red-300 hover:bg-red-50"
                                              >
                                                מחק הימורים
                                              </Button>
                                            )}
                                          </>
                                        )}

                                      {/* Score Update Button */}
                                      {match.player1 &&
                                        match.player2 &&
                                        match.status !== "CANCELLED" && (
                                          <Button
                                            onClick={() =>
                                              handleOpenScoreDialog(match)
                                            }
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-xs"
                                          >
                                            <Edit className="w-3 h-3 ml-1" />
                                            {match.status === "COMPLETED"
                                              ? "עדכן תוצאה"
                                              : "הזן תוצאה"}
                                          </Button>
                                        )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            {isAdmin && (
                              <div className="mt-4 text-center">
                                <Button
                                  onClick={() =>
                                    handleOpenAddMatchDialog(
                                      roundNum,
                                      roundName
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  + הוסף משחק לסיבוב זה
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* Reset Gambling Dialog */}
              <Dialog
                open={showResetGamblingDialog}
                onOpenChange={setShowResetGamblingDialog}
              >
                <DialogContent
                  className="w-[calc(100%-2rem)] sm:max-w-md"
                  dir="rtl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-base text-right">
                      מחיקת הימורים
                    </DialogTitle>
                    <DialogDescription className="text-sm text-right">
                      האם למחוק את כל ההימורים של המשחק בין{" "}
                      {matchToResetGambling?.player1?.name} ל
                      {matchToResetGambling?.player2?.name}?
                      <br />
                      <span className="text-orange-600 mt-2 block">
                        פעולה זו תמחק{" "}
                        {getVotePercentages(matchToResetGambling).total} הימורים
                        ולא ניתן לשחזר אותם.
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowResetGamblingDialog(false)}
                      disabled={resettingGambling}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleResetGambling}
                      disabled={resettingGambling}
                      variant="destructive"
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      {resettingGambling ? "מוחק..." : "כן, מחק הימורים"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogContent
                  className="w-[calc(100%-2rem)] sm:max-w-md"
                  dir="rtl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-base text-right flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-600" />
                      מחיקת ברקט נוקאאוט
                    </DialogTitle>
                    <DialogDescription className="text-sm text-right">
                      פעולה זו תמחק את כל המשחקים בברקט. האם אתה בטוח?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={deleting}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleDeleteBracket}
                      disabled={deleting}
                      variant="destructive"
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      {deleting ? "מוחק..." : "כן, מחק ברקט"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Reset Gambling Dialog */}
              <Dialog
                open={showResetGamblingDialog}
                onOpenChange={setShowResetGamblingDialog}
              >
                <DialogContent
                  className="w-[calc(100%-2rem)] sm:max-w-md"
                  dir="rtl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-base text-right">
                      מחיקת הימורים
                    </DialogTitle>
                    <DialogDescription className="text-sm text-right">
                      האם למחוק את כל ההימורים של המשחק בין{" "}
                      {matchToResetGambling?.player1?.name} ל
                      {matchToResetGambling?.player2?.name}?
                      <br />
                      <span className="text-orange-600 mt-2 block">
                        פעולה זו תמחק{" "}
                        {getVotePercentages(matchToResetGambling).total} הימורים
                        ולא ניתן לשחזר אותם.
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowResetGamblingDialog(false)}
                      disabled={resettingGambling}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleResetGambling}
                      disabled={resettingGambling}
                      variant="destructive"
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      {resettingGambling ? "מוחק..." : "כן, מחק הימורים"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Cancel Match Dialog */}
              <Dialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
              >
                <DialogContent
                  className="w-[calc(100%-2rem)] sm:max-w-md"
                  dir="rtl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-base text-right">
                      {matchToCancel?.status === "CANCELLED"
                        ? "שחזור משחק"
                        : "ביטול משחק"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-right">
                      {matchToCancel?.status === "CANCELLED" ? (
                        "האם לשחזר את המשחק? שני השחקנים יוכלו להתחרות שוב."
                      ) : (
                        <>
                          {matchToCancel?.status === "COMPLETED" && (
                            <span className="text-orange-600 block mb-2">
                              ⚠️ אזהרה: למשחק זה יש כבר תוצאה!
                            </span>
                          )}
                          האם לבטל את המשחק בין {matchToCancel?.player1?.name} ל
                          {matchToCancel?.player2?.name}? שני השחקנים לא יילקחו
                          בחשבון לסיבוב הבא.
                        </>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(false)}
                      disabled={togglingCancel}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleToggleCancelled}
                      disabled={togglingCancel}
                      variant={
                        matchToCancel?.status === "CANCELLED"
                          ? "default"
                          : "destructive"
                      }
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      {togglingCancel
                        ? "מבצע..."
                        : matchToCancel?.status === "CANCELLED"
                        ? "כן, שחזר משחק"
                        : "כן, בטל משחק"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add Custom Match Dialog */}
              <Dialog
                open={showAddMatchDialog}
                onOpenChange={setShowAddMatchDialog}
              >
                <DialogContent
                  className="w-[calc(100%-2rem)] sm:max-w-md"
                  dir="rtl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-base text-right">
                      הוסף משחק ל{selectedRound?.roundName}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-right">
                      בחר שני שחקנים שאינם במשחק אחר בסיבוב זה
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4" dir="rtl">
                    {/* Player 1 Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="player1" className="text-right block">
                        שחקן 1
                      </Label>
                      <select
                        id="player1"
                        value={selectedPlayer1}
                        onChange={(e) => setSelectedPlayer1(e.target.value)}
                        className="w-full p-2 border rounded-md text-right"
                        dir="rtl"
                      >
                        <option value="">בחר שחקן...</option>
                        {getAvailablePlayers().map((player: any) => (
                          <option key={player._id} value={player._id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Player 2 Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="player2" className="text-right block">
                        שחקן 2
                      </Label>
                      <select
                        id="player2"
                        value={selectedPlayer2}
                        onChange={(e) => setSelectedPlayer2(e.target.value)}
                        className="w-full p-2 border rounded-md text-right"
                        dir="rtl"
                      >
                        <option value="">בחר שחקן...</option>
                        {getAvailablePlayers()
                          .filter((p: any) => p._id !== selectedPlayer1)
                          .map((player: any) => (
                            <option key={player._id} value={player._id}>
                              {player.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddMatchDialog(false)}
                      disabled={creatingMatch}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleCreateCustomMatch}
                      disabled={
                        creatingMatch ||
                        !selectedPlayer1 ||
                        !selectedPlayer2 ||
                        selectedPlayer1 === selectedPlayer2
                      }
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      {creatingMatch ? "יוצר משחק..." : "צור משחק"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Score Update Dialog */}
              <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
                <DialogContent
                  className="w-[calc(100%-2rem)] sm:max-w-md"
                  dir="rtl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-base text-right flex items-center gap-2">
                      <Edit className="w-5 h-5 text-blue-600" />
                      עדכון תוצאה
                    </DialogTitle>
                    <DialogDescription className="text-sm text-right">
                      הזן את התוצאה הסופית של המשחק
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4" dir="rtl">
                    {/* Player 1 Score */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="player1Score"
                        className="text-right block"
                      >
                        {selectedMatch?.player1?.name || "שחקן 1"}
                      </Label>
                      <Input
                        id="player1Score"
                        type="number"
                        min="0"
                        value={player1Score}
                        onChange={(e) =>
                          setPlayer1Score(Number(e.target.value))
                        }
                        className="text-center text-lg"
                      />
                    </div>

                    {/* Player 2 Score */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="player2Score"
                        className="text-right block"
                      >
                        {selectedMatch?.player2?.name || "שחקן 2"}
                      </Label>
                      <Input
                        id="player2Score"
                        type="number"
                        min="0"
                        value={player2Score}
                        onChange={(e) =>
                          setPlayer2Score(Number(e.target.value))
                        }
                        className="text-center text-lg"
                      />
                    </div>

                    {player1Score === player2Score && (
                      <p className="text-sm text-orange-600 text-right">
                        ⚠️ תיקו - יש להזין תוצאות שונות
                      </p>
                    )}
                  </div>
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowScoreDialog(false)}
                      disabled={updatingScore}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleUpdateScore}
                      disabled={updatingScore || player1Score === player2Score}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      {updatingScore ? "מעדכן..." : "עדכן תוצאה"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function KnockoutPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">טוען...</div>
        </div>
      }
    >
      <KnockoutPage />
    </Suspense>
  );
}
