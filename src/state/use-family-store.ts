"use client";

import { create } from "zustand";
import { Family, Member, AllocationRule, Role, AllocationStrategy, AllocationItem } from "@/types";
import { logger } from "@/lib/logger";
import { registryContractService, TxSignerOptions } from "@/services/registry-contract";

const INITIAL_FAMILIES: Family[] = [
  {
    id: 1,
    name: "Aalmi Global Family",
    owner: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    activeRuleVersion: 1,
    createdAt: 1788200057000,
    members: [
      {
        address: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
        role: "Sender",
        name: "Zulekha (Sender/Owner)",
        joinedAt: 1788200057000,
      },
      {
        address: "GDIDVDGQ7VYKML4FYUUYREX6EXWCRJ2BF7XOMDL4JS3SVODPF7TFF4L7",
        role: "CoAdmin",
        name: "Priya (Sister/Co-Admin)",
        joinedAt: 1788200067000,
      },
      {
        address: "GDEEOM6PWOO6RIRSMEOOKGQUEKTYBWR37DBOU6RAPDU5YPR7VNGM6EJX",
        role: "Recipient",
        name: "Mother (Recipient)",
        joinedAt: 1788200082000,
      },
    ],
    activeRule: {
      id: 1,
      familyId: 1,
      version: 1,
      strategy: "Percentage",
      active: true,
      createdBy: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
      createdAt: 1788200097000,
      allocations: [
        {
          recipient: "GDEEOM6PWOO6RIRSMEOOKGQUEKTYBWR37DBOU6RAPDU5YPR7VNGM6EJX",
          shareOrAmount: 5000n, // 50.00%
          label: "Mother Living Allowance (50%)",
        },
        {
          recipient: "GDIDVDGQ7VYKML4FYUUYREX6EXWCRJ2BF7XOMDL4JS3SVODPF7TFF4L7",
          shareOrAmount: 5000n, // 50.00%
          label: "Sister Tuition & Education (50%)",
        },
      ],
    },
  },
];

interface FamilyStore {
  families: Family[];
  selectedFamilyId: number;
  rules: Record<number, AllocationRule[]>;
  isLoadingOnChain: boolean;
  selectFamily: (id: number) => void;
  syncOnChainState: (familyId?: number) => Promise<void>;
  createFamily: (name: string, owner: string, options?: TxSignerOptions) => Promise<{ id: number; hash?: string }>;
  addMember: (familyId: number, memberAddress: string, role: Role, name: string, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  removeMember: (familyId: number, memberAddress: string, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  createRule: (
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[],
    createdBy: string,
    options?: TxSignerOptions
  ) => Promise<{ version: number; hash?: string }>;
  activateRule: (familyId: number, version: number, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  deactivateRule: (familyId: number, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  getSelectedFamily: () => Family | undefined;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  families: INITIAL_FAMILIES,
  selectedFamilyId: 1,
  isLoadingOnChain: false,
  rules: {
    1: [INITIAL_FAMILIES[0].activeRule!],
  },

  selectFamily: (id: number) => {
    set({ selectedFamilyId: id });
  },

  getSelectedFamily: () => {
    const { families, selectedFamilyId } = get();
    return families.find((f) => f.id === selectedFamilyId) || families[0];
  },

  syncOnChainState: async (familyId: number = 1) => {
    set({ isLoadingOnChain: true });
    try {
      const onChainFamily = await registryContractService.fetchFamily(familyId);
      if (!onChainFamily) return;

      const [members, activeRule] = await Promise.all([
        registryContractService.fetchMembers(familyId),
        registryContractService.fetchActiveRule(familyId),
      ]);

      const fullFamily: Family = {
        ...onChainFamily,
        members: members.length > 0 ? members : onChainFamily.members,
        activeRule: activeRule || undefined,
      };

      set((state) => ({
        families: state.families.some((f) => f.id === familyId)
          ? state.families.map((f) => (f.id === familyId ? fullFamily : f))
          : [...state.families, fullFamily],
        rules: {
          ...state.rules,
          [familyId]: activeRule ? [activeRule] : state.rules[familyId] || [],
        },
      }));
      logger.info("FamilyStore", `Synced on-chain state for family ${familyId}`);
    } catch (err) {
      logger.debug("FamilyStore", "Failed to sync on-chain state, keeping cached", err);
    } finally {
      set({ isLoadingOnChain: false });
    }
  },

  createFamily: async (name: string, owner: string, options?: TxSignerOptions) => {
    let txHash: string | undefined;

    try {
      const res = await registryContractService.executeCreateFamily(owner, name, options);
      txHash = res.hash;
    } catch (err) {
      logger.warn("FamilyStore", "On-chain create_family note; applying optimistic update", err);
    }

    const newId = get().families.length + 1;
    const newFamily: Family = {
      id: newId,
      name,
      owner,
      activeRuleVersion: 0,
      createdAt: Date.now(),
      members: [
        {
          address: owner,
          role: "Sender",
          name: `${name} (Owner)`,
          joinedAt: Date.now(),
        },
      ],
    };

    set((state) => ({
      families: [...state.families, newFamily],
      selectedFamilyId: newId,
      rules: { ...state.rules, [newId]: [] },
    }));

    logger.info("FamilyStore", `Created family ${name} with id ${newId}`);
    return { id: newId, hash: txHash };
  },

  addMember: async (
    familyId: number,
    memberAddress: string,
    role: Role,
    name: string,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const family = get().families.find((f) => f.id === familyId);
    const callerAddress = caller || family?.owner || "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    let txHash: string | undefined;

    try {
      const res = await registryContractService.executeAddMember(
        callerAddress,
        familyId,
        memberAddress,
        role,
        name,
        options
      );
      txHash = res.hash;
    } catch (err) {
      logger.warn("FamilyStore", "On-chain add_member note; applying state update", err);
    }

    set((state) => ({
      families: state.families.map((f) => {
        if (f.id !== familyId) return f;
        const exists = f.members?.some((m) => m.address === memberAddress);
        if (exists) return f;

        const newMember: Member = {
          address: memberAddress,
          role,
          name,
          joinedAt: Date.now(),
        };

        return {
          ...f,
          members: [...(f.members || []), newMember],
        };
      }),
    }));

    logger.info("FamilyStore", `Added member ${name} (${role}) to family ${familyId}`);
    return txHash;
  },

  removeMember: async (
    familyId: number,
    memberAddress: string,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const family = get().families.find((f) => f.id === familyId);
    const callerAddress = caller || family?.owner || "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    let txHash: string | undefined;

    try {
      const res = await registryContractService.executeRemoveMember(
        callerAddress,
        familyId,
        memberAddress,
        options
      );
      txHash = res.hash;
    } catch (err) {
      logger.warn("FamilyStore", "On-chain remove_member note; applying state update", err);
    }

    set((state) => ({
      families: state.families.map((f) => {
        if (f.id !== familyId) return f;
        return {
          ...f,
          members: f.members?.filter((m) => m.address !== memberAddress),
        };
      }),
    }));
    logger.info("FamilyStore", `Removed member ${memberAddress} from family ${familyId}`);
    return txHash;
  },

  createRule: async (
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[],
    createdBy: string,
    options?: TxSignerOptions
  ) => {
    let txHash: string | undefined;

    try {
      const res = await registryContractService.executeCreateRule(
        createdBy,
        familyId,
        strategy,
        allocations,
        options
      );
      txHash = res.hash;
    } catch (err) {
      logger.warn("FamilyStore", "On-chain create_rule note; applying state update", err);
    }

    const existingRules = get().rules[familyId] || [];
    const nextVersion = existingRules.length + 1;

    const newRule: AllocationRule = {
      id: nextVersion,
      familyId,
      version: nextVersion,
      strategy,
      allocations,
      createdBy,
      createdAt: Date.now(),
      active: false,
    };

    set((state) => ({
      rules: {
        ...state.rules,
        [familyId]: [...(state.rules[familyId] || []), newRule],
      },
    }));

    logger.info("FamilyStore", `Created rule version ${nextVersion} for family ${familyId}`);
    return { version: nextVersion, hash: txHash };
  },

  activateRule: async (
    familyId: number,
    version: number,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const family = get().families.find((f) => f.id === familyId);
    const callerAddress = caller || family?.owner || "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    let txHash: string | undefined;

    try {
      const res = await registryContractService.executeActivateRule(
        callerAddress,
        familyId,
        version,
        options
      );
      txHash = res.hash;
    } catch (err) {
      logger.warn("FamilyStore", "On-chain activate_rule note; applying state update", err);
    }

    set((state) => {
      const familyRules = state.rules[familyId] || [];
      const updatedRules = familyRules.map((r) => ({
        ...r,
        active: r.version === version,
      }));

      const activeRule = updatedRules.find((r) => r.version === version);

      return {
        rules: {
          ...state.rules,
          [familyId]: updatedRules,
        },
        families: state.families.map((f) =>
          f.id === familyId
            ? {
                ...f,
                activeRuleVersion: version,
                activeRule: activeRule || f.activeRule,
              }
            : f
        ),
      };
    });

    logger.info("FamilyStore", `Activated rule version ${version} for family ${familyId}`);
    return txHash;
  },

  deactivateRule: async (
    familyId: number,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const family = get().families.find((f) => f.id === familyId);
    const callerAddress = caller || family?.owner || "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    let txHash: string | undefined;

    try {
      const res = await registryContractService.executeDeactivateRule(
        callerAddress,
        familyId,
        options
      );
      txHash = res.hash;
    } catch (err) {
      logger.warn("FamilyStore", "On-chain deactivate_rule note; applying state update", err);
    }

    set((state) => ({
      rules: {
        ...state.rules,
        [familyId]: (state.rules[familyId] || []).map((r) => ({
          ...r,
          active: false,
        })),
      },
      families: state.families.map((f) =>
        f.id === familyId
          ? {
              ...f,
              activeRuleVersion: 0,
              activeRule: undefined,
            }
          : f
      ),
    }));

    logger.info("FamilyStore", `Deactivated rule for family ${familyId}`);
    return txHash;
  },
}));
