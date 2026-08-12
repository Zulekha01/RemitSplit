"use client";

import { create } from "zustand";
import { Family, Member, AllocationRule, Role, AllocationStrategy, AllocationItem } from "@/types";
import { logger } from "@/lib/logger";

const INITIAL_FAMILIES: Family[] = [
  {
    id: 1,
    name: "Aalmi Global Family",
    owner: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    activeRuleVersion: 1,
    createdAt: Date.now() - 86400000 * 5,
    members: [
      {
        address: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
        role: "Sender",
        name: "Zulekha (Sender/Owner)",
        joinedAt: Date.now() - 86400000 * 5,
      },
      {
        address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFXYAOWB74L4R3Z3E6S7",
        role: "CoAdmin",
        name: "Priya (Sister/Co-Admin)",
        joinedAt: Date.now() - 86400000 * 4,
      },
      {
        address: "GCKXE2C7KEW3OGCMFU2P4F4DMBRCI3FNQ4BXLFMNDLFJUNPU2HY3ZMF",
        role: "Recipient",
        name: "Parents (Home Country)",
        joinedAt: Date.now() - 86400000 * 4,
      },
      {
        address: "GAYOLLLVPWNOY2R4CMFU2P4F4DMBRCI3FNQ4BXLFMNDLFJUNPU2HY3Z",
        role: "Recipient",
        name: "Rahul (University Sibling)",
        joinedAt: Date.now() - 86400000 * 3,
      },
      {
        address: "GB3K5ZJ6E7F4CMFU2P4F4DMBRCI3FNQ4BXLFMNDLFJUNPU2HY3ZMFA",
        role: "Recipient",
        name: "Amina (Dependent)",
        joinedAt: Date.now() - 86400000 * 3,
      },
    ],
    activeRule: {
      id: 1,
      familyId: 1,
      version: 1,
      strategy: "Percentage",
      active: true,
      createdBy: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
      createdAt: Date.now() - 86400000 * 4,
      allocations: [
        {
          recipient: "GCKXE2C7KEW3OGCMFU2P4F4DMBRCI3FNQ4BXLFMNDLFJUNPU2HY3ZMF",
          shareOrAmount: 5000n, // 50.00%
          label: "Parents Living Expenses (50%)",
        },
        {
          recipient: "GAYOLLLVPWNOY2R4CMFU2P4F4DMBRCI3FNQ4BXLFMNDLFJUNPU2HY3Z",
          shareOrAmount: 3000n, // 30.00%
          label: "Sibling Tuition (30%)",
        },
        {
          recipient: "GB3K5ZJ6E7F4CMFU2P4F4DMBRCI3FNQ4BXLFMNDLFJUNPU2HY3ZMFA",
          shareOrAmount: 2000n, // 20.00%
          label: "Family Medical Emergency Fund (20%)",
        },
      ],
    },
  },
];

interface FamilyStore {
  families: Family[];
  selectedFamilyId: number;
  rules: Record<number, AllocationRule[]>; // familyId -> rules
  selectFamily: (id: number) => void;
  createFamily: (name: string, owner: string) => Promise<number>;
  addMember: (familyId: number, memberAddress: string, role: Role, name: string) => Promise<void>;
  removeMember: (familyId: number, memberAddress: string) => Promise<void>;
  createRule: (
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[],
    createdBy: string
  ) => Promise<number>;
  activateRule: (familyId: number, version: number) => Promise<void>;
  deactivateRule: (familyId: number) => Promise<void>;
  getSelectedFamily: () => Family | undefined;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  families: INITIAL_FAMILIES,
  selectedFamilyId: 1,
  rules: {
    1: [
      INITIAL_FAMILIES[0].activeRule!,
    ],
  },

  selectFamily: (id: number) => {
    set({ selectedFamilyId: id });
  },

  getSelectedFamily: () => {
    const { families, selectedFamilyId } = get();
    return families.find((f) => f.id === selectedFamilyId) || families[0];
  },

  createFamily: async (name: string, owner: string) => {
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
    return newId;
  },

  addMember: async (familyId: number, memberAddress: string, role: Role, name: string) => {
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
  },

  removeMember: async (familyId: number, memberAddress: string) => {
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
  },

  createRule: async (
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[],
    createdBy: string
  ) => {
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
    return nextVersion;
  },

  activateRule: async (familyId: number, version: number) => {
    const existingRules = get().rules[familyId] || [];
    const targetRule = existingRules.find((r) => r.version === version);

    if (!targetRule) return;

    set((state) => ({
      rules: {
        ...state.rules,
        [familyId]: (state.rules[familyId] || []).map((r) => ({
          ...r,
          active: r.version === version,
        })),
      },
      families: state.families.map((f) => {
        if (f.id !== familyId) return f;
        return {
          ...f,
          activeRuleVersion: version,
          activeRule: { ...targetRule, active: true },
        };
      }),
    }));

    logger.info("FamilyStore", `Activated rule version ${version} for family ${familyId}`);
  },

  deactivateRule: async (familyId: number) => {
    set((state) => ({
      rules: {
        ...state.rules,
        [familyId]: (state.rules[familyId] || []).map((r) => ({
          ...r,
          active: false,
        })),
      },
      families: state.families.map((f) => {
        if (f.id !== familyId) return f;
        return {
          ...f,
          activeRuleVersion: 0,
          activeRule: undefined,
        };
      }),
    }));

    logger.info("FamilyStore", `Deactivated active rule for family ${familyId}`);
  },
}));
