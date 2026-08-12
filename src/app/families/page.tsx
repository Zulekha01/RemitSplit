"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useFamilyStore } from "@/state/use-family-store";
import { useWalletStore } from "@/state/use-wallet-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { AddressPill } from "@/components/shared/address-pill";
import { formatTimestamp } from "@/lib/formatters";
import { Role } from "@/types";

export default function FamiliesPage() {
  const { families, selectedFamilyId, getSelectedFamily, createFamily, addMember, removeMember } = useFamilyStore();
  const { address, isConnected } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const { addEvent } = useActivityStore();

  const family = getSelectedFamily();
  const members = family?.members || [];

  // Modals state
  const [createFamilyOpen, setCreateFamilyOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Role>("Recipient");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const ownerAddress = address || "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S";
      const newId = await createFamily(newFamilyName.trim(), ownerAddress);

      const fakeHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      addTransaction({
        hash: fakeHash,
        type: "CREATE_FAMILY",
        status: "CONFIRMED",
        familyId: newId,
        familyName: newFamilyName.trim(),
        depositor: ownerAddress,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}`,
        type: "FAMILY_CREATED",
        familyId: newId,
        actor: ownerAddress,
        timestamp: Date.now(),
        txHash: fakeHash,
        details: `Created new family group: "${newFamilyName.trim()}"`,
      });

      setNewFamilyName("");
      setCreateFamilyOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create family");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberAddress.trim() || !family) return;

    if (!newMemberAddress.startsWith("G") || newMemberAddress.length !== 56) {
      setErrorMsg("Invalid Stellar public key address (must start with G and be 56 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await addMember(family.id, newMemberAddress.trim(), newMemberRole, newMemberName.trim());

      const fakeHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      addTransaction({
        hash: fakeHash,
        type: "ADD_MEMBER",
        status: "CONFIRMED",
        familyId: family.id,
        familyName: family.name,
        depositor: address || family.owner,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}`,
        type: "MEMBER_ADDED",
        familyId: family.id,
        actor: address || family.owner,
        recipient: newMemberAddress.trim(),
        timestamp: Date.now(),
        txHash: fakeHash,
        details: `Added ${newMemberName.trim()} (${newMemberRole}) to family`,
      });

      setNewMemberName("");
      setNewMemberAddress("");
      setNewMemberRole("Recipient");
      setAddMemberOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberAddress: string) => {
    if (!family) return;
    if (memberAddress === family.owner) {
      alert("Family Owner cannot be removed.");
      return;
    }

    if (confirm("Are you sure you want to remove this family member?")) {
      await removeMember(family.id, memberAddress);

      const fakeHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      addTransaction({
        hash: fakeHash,
        type: "REMOVE_MEMBER",
        status: "CONFIRMED",
        familyId: family.id,
        familyName: family.name,
        depositor: address || family.owner,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}`,
        type: "MEMBER_REMOVED",
        familyId: family.id,
        actor: address || family.owner,
        timestamp: Date.now(),
        txHash: fakeHash,
        details: `Removed member ${memberAddress.slice(0, 4)}...${memberAddress.slice(-4)} from family`,
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Family &amp; Member Directory
              </h1>
              <Badge variant="stellar">RBAC Controlled</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage family group members, approve beneficiary addresses, and delegate co-admin roles.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setCreateFamilyOpen(true)}
              className="border-slate-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Family
            </Button>

            <Button
              onClick={() => setAddMemberOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Family Summary & Members Table */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">
                {family?.name || "Family Group"}
              </CardTitle>
              <CardDescription className="mt-1">
                Owner / Sender: <span className="font-mono text-foreground font-medium">{family?.owner}</span>
              </CardDescription>
            </div>
            <Badge variant="success">
              {members.length} Total Members
            </Badge>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name / Label</TableHead>
                  <TableHead>Stellar Public Key</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.address}>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      {member.name}
                      {member.address === family?.owner && (
                        <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase">
                          Creator
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AddressPill address={member.address} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "Sender"
                            ? "stellar"
                            : member.role === "CoAdmin"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(member.joinedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.address !== family?.owner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.address)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Permissions Matrix Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Role-Based Access Control (RBAC) Permissions</CardTitle>
            </div>
            <CardDescription>
              Smart contract enforced capabilities on Soroban ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 space-y-2">
                <div className="font-bold text-sm text-blue-900 dark:text-blue-200">Sender (Owner)</div>
                <p className="text-muted-foreground">Highest authority in the family group.</p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  <li>✓ Deposit &amp; execute remittance splits</li>
                  <li>✓ Create, activate, &amp; deactivate rules</li>
                  <li>✓ Add &amp; remove all members &amp; co-admins</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="font-bold text-sm text-amber-900 dark:text-amber-200">Co-Administrator</div>
                <p className="text-muted-foreground">Delegated family manager.</p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  <li>✓ Propose new split rule versions</li>
                  <li>✓ Add approved recipient members</li>
                  <li>✗ Cannot activate rules or deposit without owner</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-200">Recipient (Beneficiary)</div>
                <p className="text-muted-foreground">Approved payout beneficiary.</p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  <li>✓ Receive automated split funds directly</li>
                  <li>✓ View allocations and audit transaction records</li>
                  <li>✗ Read-only permissions on group rules</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Create Family */}
      <Dialog open={createFamilyOpen} onOpenChange={setCreateFamilyOpen}>
        <DialogHeader>
          <DialogTitle>Create New Family Group</DialogTitle>
          <DialogDescription>
            Register a new programmable remittance family group on Stellar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateFamily} className="space-y-4 mt-2">
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Family Group Name</label>
            <Input
              placeholder="e.g. Sharma Family Support"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateFamilyOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isSubmitting ? "Creating..." : "Create Family"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Dialog: Add Member */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Register a beneficiary or co-admin under {family?.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddMember} className="space-y-4 mt-2">
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Member Name / Label</label>
            <Input
              placeholder="e.g. Grandmother (Medical Support)"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Stellar Public Key (G...)</label>
            <Input
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={newMemberAddress}
              onChange={(e) => setNewMemberAddress(e.target.value)}
              className="font-mono text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Role</label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as Role)}
              className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Recipient">Recipient (Beneficiary)</option>
              <option value="CoAdmin">Co-Administrator (Delegated)</option>
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddMemberOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </AppShell>
  );
}
