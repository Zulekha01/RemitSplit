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
  const { families, selectedFamilyId, selectFamily, getSelectedFamily, createFamily, addMember, removeMember, syncOnChainState, isLoadingOnChain } =
    useFamilyStore();
  const { address, isConnected, connect, getSignerOptions } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const { addEvent } = useActivityStore();

  // Families that belong to the user
  const userFamilies = address
    ? families.filter((f) => f.owner === address || f.members?.some((m) => m.address === address))
    : [];

  const family = getSelectedFamily();
  const members = family?.members || [];

  const [createFamilyOpen, setCreateFamilyOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Role>("Recipient");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    syncOnChainState(selectedFamilyId);
  }, [selectedFamilyId, syncOnChainState]);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    if (!address) {
      setErrorMsg("Please connect your Stellar wallet first.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const ownerAddress = address;
      const signerOpts = getSignerOptions();
      const { id: newId, hash } = await createFamily(newFamilyName.trim(), ownerAddress, signerOpts);

      if (hash) {
        addTransaction({
          hash,
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
          txHash: hash,
          details: `Registered new family group: "${newFamilyName.trim()}" on Stellar Testnet`,
        });
      }

      setNewFamilyName("");
      setCreateFamilyOpen(false);
      await syncOnChainState(newId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create family record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberAddress.trim() || !family) return;

    if (!address) {
      setErrorMsg("Please connect your Stellar wallet first.");
      return;
    }

    if (!newMemberAddress.startsWith("G") || newMemberAddress.length !== 56) {
      setErrorMsg("Invalid Stellar public key address (must start with G and be 56 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const caller = address;
      const signerOpts = getSignerOptions();
      const hash = await addMember(family.id, newMemberAddress.trim(), newMemberRole, newMemberName.trim(), caller, signerOpts);

      if (hash) {
        addTransaction({
          hash,
          type: "ADD_MEMBER",
          status: "CONFIRMED",
          familyId: family.id,
          familyName: family.name,
          depositor: caller,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        addEvent({
          id: `evt-${Date.now()}`,
          type: "MEMBER_ADDED",
          familyId: family.id,
          actor: caller,
          recipient: newMemberAddress.trim(),
          timestamp: Date.now(),
          txHash: hash,
          details: `Added ${newMemberName.trim()} (${newMemberRole}) to family registry on-chain`,
        });
      }

      setNewMemberName("");
      setNewMemberAddress("");
      setNewMemberRole("Recipient");
      setAddMemberOpen(false);
      await syncOnChainState(family.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add member to ledger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberAddress: string) => {
    if (!family) return;
    if (memberAddress === family.owner) {
      alert("Family Creator/Owner cannot be removed.");
      return;
    }

    if (!address) {
      alert("Please connect your Stellar wallet first.");
      return;
    }

    if (confirm("Are you sure you want to remove this family member from on-chain registry?")) {
      const caller = address;
      const signerOpts = getSignerOptions();
      const hash = await removeMember(family.id, memberAddress, caller, signerOpts);

      if (hash) {
        addTransaction({
          hash,
          type: "REMOVE_MEMBER",
          status: "CONFIRMED",
          familyId: family.id,
          familyName: family.name,
          depositor: caller,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        addEvent({
          id: `evt-${Date.now()}`,
          type: "MEMBER_REMOVED",
          familyId: family.id,
          actor: caller,
          recipient: memberAddress,
          timestamp: Date.now(),
          txHash: hash,
          details: `Removed member ${memberAddress} from family group on-chain`,
        });
      }
      await syncOnChainState(family.id);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-[#111111] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
              REGISTRY DIRECTORY · RBAC CONTROLLED
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
              Family Roster &amp; Members
            </h1>
            <p className="font-body text-xs text-[#525252]">
              Manage cryptographic beneficiary authorizations, public keys, and delegated co-administrators.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateFamilyOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Family Record
            </Button>

            <Button
              variant="default"
              size="sm"
              disabled={!family}
              onClick={() => setAddMemberOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Directory View */}
        {!isConnected ? (
          <div className="border-2 border-dashed border-[#111111] p-12 text-center space-y-4 bg-[#F9F9F7]">
            <Users className="h-10 w-10 mx-auto text-[#737373]" />
            <h3 className="font-serif text-xl font-bold text-[#111111]">
              No Stellar Wallet Connected
            </h3>
            <p className="font-body text-xs text-[#525252] max-w-md mx-auto">
              Connect your Stellar Testnet wallet to load your registered family vaults and manage verified beneficiary authorizations.
            </p>
            <Button variant="default" onClick={() => connect()}>
              Connect Stellar Wallet
            </Button>
          </div>
        ) : !family ? (
          <div className="border-2 border-dashed border-[#111111] p-12 text-center space-y-4 bg-[#F9F9F7]">
            <Users className="h-10 w-10 mx-auto text-[#737373]" />
            <h3 className="font-serif text-xl font-bold text-[#111111]">
              No On-Chain Family Vault Selected
            </h3>
            <p className="font-body text-xs text-[#525252] max-w-md mx-auto">
              {userFamilies.length > 0
                ? "Select one of your registered family vaults from the selector or register a new family group."
                : "No family records registered yet on Stellar Testnet for your account. Register your first family group to authorize members and automate remittances."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {userFamilies.length > 0 && (
                <select
                  value={selectedFamilyId}
                  onChange={(e) => selectFamily(Number(e.target.value))}
                  className="border-2 border-[#111111] bg-white px-3 py-1.5 text-xs font-mono font-bold"
                >
                  <option value={0}>Choose a Family Vault...</option>
                  {userFamilies.map((f) => (
                    <option key={f.id} value={f.id}>
                      #{f.id} · {f.name}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="default" onClick={() => setCreateFamilyOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Register New Family Vault
              </Button>
            </div>
          </div>
        ) : (
          /* Directory Broadsheet Table */
          <div className="border-2 border-[#111111] bg-[#F9F9F7]">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#CC0000]">
                  ACTIVE GROUP DIRECTORY
                </span>
                <h3 className="font-serif text-xl font-bold text-[#111111]">
                  {family.name}
                </h3>
              </div>
              <Badge variant="default">
                {members.length} VERIFIED MEMBERS
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name / Purpose</TableHead>
                  <TableHead>Stellar Public Key</TableHead>
                  <TableHead>Role Authority</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-xs font-mono text-[#737373]">
                      No beneficiary members registered in this family group yet. Click &quot;Add Member&quot; to authorize an on-chain recipient.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.address}>
                      <TableCell className="font-serif font-bold text-sm text-[#111111]">
                        {member.name}
                        {member.address === family?.owner && (
                          <span className="ml-2 font-mono text-[9px] bg-[#111111] text-[#F9F9F7] px-1.5 py-0.5 uppercase tracking-wider font-bold">
                            CREATOR
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <AddressPill address={member.address} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === "Sender" ? "default" : member.role === "CoAdmin" ? "secondary" : "outline"}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[#737373]">
                        {formatTimestamp(member.joinedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.address !== family?.owner && (
                          <button
                            onClick={() => handleRemoveMember(member.address)}
                            className="p-1 text-[#737373] hover:text-[#CC0000] transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 3-Column RBAC Authority Matrix (Newspaper Column Style) */}
        <div className="border-2 border-[#111111] bg-[#F9F9F7]">
          <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5]">
            <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#111111]">
              ON-CHAIN ROLE-BASED ACCESS CONTROL (RBAC) GOVERNANCE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#111111] p-0 font-mono text-xs">
            <div className="p-6 space-y-3 bg-[#F9F9F7]">
              <div className="font-serif font-bold text-base text-[#111111]">
                Sender (Owner)
              </div>
              <p className="font-body text-xs text-[#525252]">
                Highest authority over the family vault on Soroban.
              </p>
              <ul className="space-y-1.5 text-[11px] text-[#111111]">
                <li>✓ Deposit &amp; execute remittance splits</li>
                <li>✓ Create, activate &amp; deactivate rules</li>
                <li>✓ Add &amp; remove all members</li>
              </ul>
            </div>

            <div className="p-6 space-y-3 bg-[#F9F9F7]">
              <div className="font-serif font-bold text-base text-[#111111]">
                Co-Administrator
              </div>
              <p className="font-body text-xs text-[#525252]">
                Delegated trusted manager for family operations.
              </p>
              <ul className="space-y-1.5 text-[11px] text-[#111111]">
                <li>✓ Propose new split rule versions</li>
                <li>✓ Add approved recipient members</li>
                <li>✗ Cannot execute deposits or withdraw</li>
              </ul>
            </div>

            <div className="p-6 space-y-3 bg-[#F9F9F7]">
              <div className="font-serif font-bold text-base text-[#111111]">
                Recipient (Beneficiary)
              </div>
              <p className="font-body text-xs text-[#525252]">
                Approved payout recipient account.
              </p>
              <ul className="space-y-1.5 text-[11px] text-[#111111]">
                <li>✓ Receive automated split funds directly</li>
                <li>✓ Full audit trail of distributions</li>
                <li>✗ Read-only permissions on group rules</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: Create Family */}
      <Dialog open={createFamilyOpen} onOpenChange={setCreateFamilyOpen}>
        <DialogHeader>
          <DialogTitle>Register New Family Record</DialogTitle>
          <DialogDescription>
            Deploy a new programmable remittance family group on Stellar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateFamily} className="space-y-4 font-mono text-xs">
          {errorMsg && <p className="text-xs text-[#CC0000] font-bold">{errorMsg}</p>}
          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider">Family Group Name</label>
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
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deploying..." : "Create Family Record"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Dialog: Add Member */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogHeader>
          <DialogTitle>Add Family Member to Registry</DialogTitle>
          <DialogDescription>
            Authorize an approved beneficiary or co-admin under {family?.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddMember} className="space-y-4 font-mono text-xs">
          {errorMsg && <p className="text-xs text-[#CC0000] font-bold">{errorMsg}</p>}
          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider">Member Label / Name</label>
            <Input
              placeholder="e.g. Grandmother (Medical Care)"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider">Stellar Public Key (G...)</label>
            <Input
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={newMemberAddress}
              onChange={(e) => setNewMemberAddress(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider">Assigned Role Authority</label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as Role)}
              className="w-full text-xs font-mono border-2 border-[#111111] bg-[#F9F9F7] px-3 py-2 text-[#111111] focus:outline-none"
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
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding to Registry..." : "Save Member"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </AppShell>
  );
}
