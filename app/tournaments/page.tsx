"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import PlayerFrontendService from "@/app/frontendServices/player.frontendService";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Trophy,
  Users,
  ArrowLeft,
  Clock,
  Award,
  Target,
  Search,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";

interface Tournament {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endOfRegistration: string;
  format: string;
  location: string;
  prizePool: string;
  maxPlayers: number;
  players: any[];
  matches: any[];
  status: string;
  mainImage: string;
  winner: any;
}

function TournamentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tournamentId = searchParams.get("id");
  const { isAdmin, logout } = useAuth();

  // Get current full URL for redirect
  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  // Player search state
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setSelectedTournament(null); // Reset selected tournament

    if (tournamentId) {
      fetchTournamentById(tournamentId);
      fetchAllPlayers(); // Fetch players for autocomplete
    } else {
      fetchTournaments();
    }
  }, [tournamentId]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await TournamentFrontendService.getTournaments(true);
      if (response.success && response.data) {
        setTournaments(response.data as Tournament[]);
      } else {
        toast.error("נכשל בטעינת הטורנירים");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentById = async (id: string) => {
    try {
      const response = await TournamentFrontendService.getTournamentById(id);
      if (response.success && response.data) {
        setSelectedTournament(response.data as Tournament);
      } else {
        toast.error("הטורניר לא נמצא");
        router.push("/tournaments");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
      router.push("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlayers = async () => {
    try {
      const response = await PlayerFrontendService.getPlayers();
      if (response.success && response.data) {
        setAllPlayers(response.data as any[]);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  const handleAddPlayerToTournament = async () => {
    if (!selectedPlayer || !selectedTournament) return;

    setAddingPlayer(true);
    try {
      const response = await TournamentFrontendService.addPlayerToTournament(
        selectedPlayer._id,
        selectedTournament._id
      );

      if (response.success) {
        toast.success(`${selectedPlayer.name} נוסף לטורניר!`);
        // Refresh tournament data
        await fetchTournamentById(selectedTournament._id);
        setSearchQuery("");
        setSelectedPlayer(null);
      } else {
        toast.error(response.error || "נכשל בהוספת שחקן");
      }
    } catch (error) {
      toast.error("אירעה שגיאה");
    } finally {
      setAddingPlayer(false);
      setShowConfirmDialog(false);
    }
  };

  const handlePlayerSelect = (player: any) => {
    setSelectedPlayer(player);
    setShowSuggestions(false);
    setShowConfirmDialog(true);
  };

  const filteredPlayers = allPlayers.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const notAlreadyInTournament = !selectedTournament?.players?.some(
      (p: any) => p._id === player._id
    );
    return matchesSearch && notAlreadyInTournament;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-700";
      case "ONGOING":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Show tournament detail view
  if (selectedTournament) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation - Mobile Optimized */}
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
              <Link href="/tournaments">
                <Button variant="ghost" size="sm" className="text-sm">
                  טורנירים
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-3 sm:px-4 pt-16 pb-8">
          <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <Link href="/tournaments"></Link>

            {loading ? (
              <div className="text-center py-12" dir="rtl">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-3 text-sm text-center">
                  טוען פרטי טורניר...
                </p>
              </div>
            ) : (
              <>
                {/* Tournament Header */}
                <div
                  className="bg-white rounded-lg p-4 sm:p-6 mb-4 border"
                  dir="rtl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(
                          selectedTournament.status
                        )}`}
                      >
                        {selectedTournament.status}
                      </span>
                      <h1 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-900 text-right">
                        {selectedTournament.name}
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600 text-right">
                        {selectedTournament.description}
                      </p>
                    </div>
                    <div className="hidden sm:flex bg-blue-50 p-3 rounded-lg">
                      <Trophy className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Players List */}
                <Card className="border">
                  <CardHeader className="pb-3 sm:pb-4" dir="rtl">
                    <CardTitle className="flex items-center gap-2 text-lg text-right">
                      <Users className="w-5 h-5" />
                      משתתפים
                    </CardTitle>
                    <CardDescription className="text-sm text-right">
                      {selectedTournament.players?.length || 0} שחקנים רשומים
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    {/* Add Player Input */}
                    {selectedTournament.status === "UPCOMING" && (
                      <div className="mb-4" ref={searchRef} dir="rtl">
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="חפש שחקנים להוספה..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            className="pr-10 pl-4 text-sm h-10"
                            dir="rtl"
                          />

                          {/* Suggestions Dropdown */}
                          {showSuggestions && searchQuery && (
                            <div
                              className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto"
                              dir="rtl"
                            >
                              {filteredPlayers.length > 0 ? (
                                filteredPlayers.map((player) => (
                                  <button
                                    key={player._id}
                                    onClick={() => handlePlayerSelect(player)}
                                    className="w-full px-3 py-2.5 text-right hover:bg-gray-50 transition-colors border-b last:border-b-0 flex items-center gap-2.5"
                                  >
                                    <div className="flex-1 min-w-0 text-right">
                                      <p className="font-medium text-gray-900 text-sm truncate">
                                        {player.name}
                                      </p>
                                    </div>
                                    <div className="bg-blue-50 w-7 h-7 rounded-full flex items-center justify-center">
                                      <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                  לא נמצאו שחקנים
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Registered Players List */}
                    {selectedTournament.players &&
                    selectedTournament.players.length > 0 ? (
                      <div
                        className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto"
                        dir="rtl"
                      >
                        {selectedTournament.players.map(
                          (player: any, index: number) => (
                            <div
                              key={player._id || index}
                              className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1 min-w-0 text-right">
                                <p className="font-medium text-sm truncate">
                                  {player.name}
                                </p>
                              </div>
                              <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <div className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-medium text-xs flex-shrink-0">
                                {index + 1}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8" dir="rtl">
                        <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm text-center">
                          אין שחקנים רשומים עדיין
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Confirmation Dialog */}
                <Dialog
                  open={showConfirmDialog}
                  onOpenChange={setShowConfirmDialog}
                >
                  <DialogContent
                    className="w-[calc(100%-2rem)] sm:max-w-md"
                    dir="rtl"
                  >
                    <DialogHeader>
                      <DialogTitle className="text-base text-right">
                        הוסף שחקן לטורניר
                      </DialogTitle>
                      <DialogDescription className="text-sm text-right">
                        האם אתה בטוח שברצונך להוסיף את השחקן הזה לטורניר?
                      </DialogDescription>
                    </DialogHeader>

                    {selectedPlayer && (
                      <div className="py-3">
                        <div className="bg-gray-50 rounded-lg p-3 border">
                          <p className="font-semibold text-base mb-1 text-right">
                            {selectedPlayer.name}
                          </p>

                          {selectedPlayer.phoneNumber && (
                            <p className="text-sm text-gray-600 text-right">
                              {selectedPlayer.phoneNumber}
                            </p>
                          )}
                        </div>
                        <div
                          className="mt-3 flex items-center gap-2 text-sm text-gray-600"
                          dir="rtl"
                        >
                          <span className="text-right">
                            <strong>{selectedTournament?.name}</strong> :טורניר
                          </span>
                          <Trophy className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    )}

                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowConfirmDialog(false);
                          setSelectedPlayer(null);
                        }}
                        disabled={addingPlayer}
                        className="w-full sm:w-auto"
                        size="sm"
                      >
                        ביטול
                      </Button>
                      <Button
                        onClick={handleAddPlayerToTournament}
                        disabled={addingPlayer}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        {addingPlayer ? (
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
                            מוסיף...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            הוסף שחקן
                            <UserPlus className="w-3.5 h-3.5" />
                          </span>
                        )}
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

  // Show tournaments list view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Mobile Optimized */}
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
            <Link href="/tournaments">
              <Button variant="ghost" size="sm" className="text-sm">
                טורנירים
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-3 sm:px-4 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8 text-center" dir="rtl">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-gray-900">
              טורנירים
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              עיין והצטרף לתחרויות מרגשות
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12" dir="rtl">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-3 text-sm text-center">
                טוען טורנירים...
              </p>
            </div>
          ) : tournaments.length === 0 ? (
            <Card className="max-w-md mx-auto border">
              <CardContent className="py-12 text-center" dir="rtl">
                <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                <p className="text-lg text-gray-600 mb-2 text-center">
                  אין טורנירים זמינים
                </p>
                <p className="text-sm text-gray-500 text-center">
                  חזור בקרוב לאירועים הקרובים!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {tournaments.map((tournament) => (
                <Card
                  key={tournament._id}
                  className="hover:shadow-md transition-all cursor-pointer border hover:border-blue-300"
                  onClick={() =>
                    router.push(`/tournaments?id=${tournament._id}`)
                  }
                >
                  <CardHeader className="pb-3" dir="rtl">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <CardTitle className="text-base sm:text-lg hover:text-blue-600 transition-colors text-right flex-1">
                        {tournament.name}
                      </CardTitle>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                          tournament.status
                        )}`}
                      >
                        {tournament.status}
                      </span>
                    </div>
                    <CardDescription className="line-clamp-2 text-sm text-right">
                      {tournament.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2" dir="rtl">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <span className="text-right flex-1">
                        {format(new Date(tournament.startDate), "PPP")}
                      </span>
                      <Calendar className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                    {tournament.location && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="text-right flex-1 truncate">
                          {tournament.location}
                        </span>
                        <MapPin className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <span className="text-right">
                        {tournament.players?.length || 0}
                        {tournament.maxPlayers > 0 &&
                          ` / ${tournament.maxPlayers}`}{" "}
                        שחקנים
                      </span>
                      <Users className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                    {tournament.prizePool && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="font-medium text-right">
                          {tournament.prizePool}
                        </span>
                        <Trophy className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    )}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                        ← פרטים נוספים
                      </span>
                      <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-medium">
                        {tournament.format.toUpperCase()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TournamentsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">טוען...</div>
        </div>
      }
    >
      <TournamentsPage />
    </Suspense>
  );
}
