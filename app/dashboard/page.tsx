"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminFrontendService from "@/app/frontendServices/admin.frontendService";
import PlayerFrontendService from "@/app/frontendServices/player.frontendService";
import TournamentFrontendService from "@/app/frontendServices/tournament.frontendService";
import { toast } from "sonner";
import { LogOut, Users, Trophy, Plus, Trash2, Edit } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"players" | "tournaments">(
    "tournaments"
  );
  const [players, setPlayers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Player form
  const [playerForm, setPlayerForm] = useState<{
    name: string;
    email: string;
    phoneNumber: string;
    status: "ACTIVE" | "INACTIVE" | "BANNED";
  }>({
    name: "",
    email: "",
    phoneNumber: "",
    status: "INACTIVE",
  });

  // Tournament form
  const [tournamentForm, setTournamentForm] = useState<{
    name: string;
    description: string;
    startDate: string;
    endOfRegistration: string;
    format: "league" | "knockout" | "mixed" | "groups";
    maxPlayers: number;
    location: string;
    prizePool: string;
    isPublished: boolean;
  }>({
    name: "",
    description: "",
    startDate: "",
    endOfRegistration: "",
    format: "knockout",
    maxPlayers: 0,
    location: "",
    prizePool: "",
    isPublished: false,
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!AdminFrontendService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "players") {
        const response = await PlayerFrontendService.getPlayers();
        if (response.success && response.data) {
          setPlayers(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        const response = await TournamentFrontendService.getTournaments();
        if (response.success && response.data) {
          setTournaments(Array.isArray(response.data) ? response.data : []);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AdminFrontendService.logout();
    router.push("/login");
    toast.success("Logged out successfully");
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await PlayerFrontendService.createPlayer(playerForm);
      if (response.success) {
        toast.success("Player created successfully");
        setDialogOpen(false);
        setPlayerForm({
          name: "",
          email: "",
          phoneNumber: "",
          status: "INACTIVE",
        });
        fetchData();
      } else {
        toast.error(response.error || "Failed to create player");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await TournamentFrontendService.createTournament(
        tournamentForm
      );
      if (response.success) {
        toast.success("Tournament created successfully");
        setDialogOpen(false);
        setTournamentForm({
          name: "",
          description: "",
          startDate: "",
          endOfRegistration: "",
          format: "knockout",
          maxPlayers: 0,
          location: "",
          prizePool: "",
          isPublished: false,
        });
        fetchData();
      } else {
        toast.error(response.error || "Failed to create tournament");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return;
    try {
      const response = await PlayerFrontendService.deletePlayer(id);
      if (response.success) {
        toast.success("Player deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete player");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;
    try {
      const response = await TournamentFrontendService.deleteTournament(id);
      if (response.success) {
        toast.success("Tournament deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete tournament");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === "tournaments" ? "default" : "outline"}
              onClick={() => setActiveTab("tournaments")}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Tournaments
            </Button>
            <Button
              variant={activeTab === "players" ? "default" : "outline"}
              onClick={() => setActiveTab("players")}
            >
              <Users className="w-4 h-4 mr-2" />
              Players
            </Button>
          </div>

          {/* Content */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {activeTab === "players"
                      ? "Players Management"
                      : "Tournaments Management"}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "players"
                      ? "Create and manage players"
                      : "Create and manage tournaments"}
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create {activeTab === "players" ? "Player" : "Tournament"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        Create New{" "}
                        {activeTab === "players" ? "Player" : "Tournament"}
                      </DialogTitle>
                      <DialogDescription>
                        Fill in the details below to create a new{" "}
                        {activeTab === "players" ? "player" : "tournament"}.
                      </DialogDescription>
                    </DialogHeader>

                    {activeTab === "players" ? (
                      <form onSubmit={handleCreatePlayer} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={playerForm.name}
                            onChange={(e) =>
                              setPlayerForm({
                                ...playerForm,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={playerForm.email}
                            onChange={(e) =>
                              setPlayerForm({
                                ...playerForm,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number *</Label>
                          <Input
                            id="phoneNumber"
                            value={playerForm.phoneNumber}
                            onChange={(e) =>
                              setPlayerForm({
                                ...playerForm,
                                phoneNumber: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={playerForm.status}
                            onValueChange={(value) =>
                              setPlayerForm({
                                ...playerForm,
                                status: value as
                                  | "ACTIVE"
                                  | "INACTIVE"
                                  | "BANNED",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="BANNED">Banned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Create Player
                        </Button>
                      </form>
                    ) : (
                      <form
                        onSubmit={handleCreateTournament}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="tournamentName">Name *</Label>
                          <Input
                            id="tournamentName"
                            value={tournamentForm.name}
                            onChange={(e) =>
                              setTournamentForm({
                                ...tournamentForm,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            value={tournamentForm.description}
                            onChange={(e) =>
                              setTournamentForm({
                                ...tournamentForm,
                                description: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <Input
                              id="startDate"
                              type="datetime-local"
                              value={tournamentForm.startDate}
                              onChange={(e) =>
                                setTournamentForm({
                                  ...tournamentForm,
                                  startDate: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endOfRegistration">
                              Registration End *
                            </Label>
                            <Input
                              id="endOfRegistration"
                              type="datetime-local"
                              value={tournamentForm.endOfRegistration}
                              onChange={(e) =>
                                setTournamentForm({
                                  ...tournamentForm,
                                  endOfRegistration: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="format">Format *</Label>
                          <Select
                            value={tournamentForm.format}
                            onValueChange={(value) =>
                              setTournamentForm({
                                ...tournamentForm,
                                format: value as
                                  | "league"
                                  | "knockout"
                                  | "mixed"
                                  | "groups",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="league">League</SelectItem>
                              <SelectItem value="knockout">Knockout</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                              <SelectItem value="groups">Groups</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="maxPlayers">Max Players</Label>
                            <Input
                              id="maxPlayers"
                              type="number"
                              value={tournamentForm.maxPlayers}
                              onChange={(e) =>
                                setTournamentForm({
                                  ...tournamentForm,
                                  maxPlayers: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={tournamentForm.location}
                              onChange={(e) =>
                                setTournamentForm({
                                  ...tournamentForm,
                                  location: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prizePool">Prize Pool</Label>
                          <Input
                            id="prizePool"
                            value={tournamentForm.prizePool}
                            onChange={(e) =>
                              setTournamentForm({
                                ...tournamentForm,
                                prizePool: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isPublished"
                            checked={tournamentForm.isPublished}
                            onChange={(e) =>
                              setTournamentForm({
                                ...tournamentForm,
                                isPublished: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <Label htmlFor="isPublished">
                            Publish Tournament
                          </Label>
                        </div>
                        <Button type="submit" className="w-full">
                          Create Tournament
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-gray-600">Loading...</p>
              ) : activeTab === "players" ? (
                <div className="space-y-2">
                  {players.length === 0 ? (
                    <p className="text-center py-8 text-gray-600">
                      No players found
                    </p>
                  ) : (
                    players.map((player) => (
                      <div
                        key={player._id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-gray-600">
                            {player.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {player.phoneNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              player.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : player.status === "BANNED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {player.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlayer(player._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {tournaments.length === 0 ? (
                    <p className="text-center py-8 text-gray-600">
                      No tournaments found
                    </p>
                  ) : (
                    tournaments.map((tournament) => (
                      <div
                        key={tournament._id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{tournament.name}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {tournament.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              tournament.startDate
                            ).toLocaleDateString()}{" "}
                            • {tournament.format.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              tournament.isPublished
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tournament.isPublished ? "Published" : "Draft"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteTournament(tournament._id)
                            }
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
