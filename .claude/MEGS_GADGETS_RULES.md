# MEGS Gadgets Rules Reference

This document contains the complete rules for Gadgets in the MEGS (Mayfair Exponential Game System) as used in DC Heroes.

## Table of Contents

1. [Basic Concepts](#i-basic-concepts)
   - [Abilities](#a-abilities)
   - [Reliability Numbers](#b-reliability-numbers)
   - [Gadgets vs GADGETS](#c-gadgets-vs-gadgets)
   - [Gadgets and Damage](#d-gadgets-and-damage)
   - [Hero Points and Gadgets](#e-hero-points-and-gadgets)
2. [Building Gadgets](#ii-building-gadgets)
   - [Step 1: Design the Gadget](#step-1-design-the-gadget)
   - [Step 2: GM Approval](#step-2-allow-the-gm-to-approve-the-gadget)
   - [Step 3: Calculate Hero Point Cost](#step-3-calculate-hero-point-cost)
   - [Step 4: Buy Parts](#step-4-buy-parts)
   - [Step 5: Construction](#step-5-constructing-the-gadget)

---

# I. Basic Concepts

## A. Abilities

Like Characters, **Gadgets** can have **Attributes, Powers, and Skills**.

### Examples
- A **car** has Running Power (movement) and STR (carrying capacity)
- All Gadgets have **BODY** (defines how much Physical damage they can take before ceasing to function)

### Using Gadget Abilities

**Powers and Skills**: Users can employ Gadget Powers and Skills as if they were their own.
- *Example*: Changeling driving a car travels at the car's Running Power speed

**Attributes**: Usually only applicable in special situations
- *Car STR example*: Can haul weight in trunk/seats, but cannot use it to throw punches or bench press

### Italicized vs Non-Italicized Attributes

**Italicized Attributes** (e.g., *STR*, *BODY*)
- User can substitute the Gadget's Attribute for their own **in all situations**
- *Example*: Rocket Red's Battlesuit has italicized *STR* - he can use it for lifting, throwing, or combat

**Non-Italicized Attributes** (e.g., STR, BODY)
- Only applies under **specific circumstances** determined by GM
- *Bulletproof vest example*: BODY of 4 (italicized) - user can substitute when defending against Physical Attacks
- *Gun example*: BODY of 4 (not italicized) - only protects the gun itself, not the user
- *Crane example*: STR (not italicized) - only usable for lifting objects at construction sites

### Important: Substitution Not Addition

**Gadget Abilities always SUBSTITUTE for user's abilities, never add to them.**

- Character with BODY 3 wearing armor with BODY 4 now has BODY 4, **not 7**
- Character with Flame Projector 5 APs picking up napalm gun with Flame Projector 8 APs now has 8 APs, **not 13**

---

## B. Reliability Numbers

Most Gadgets have an **"R#"** (Reliability Number) listed in their descriptions.

### What is R#?
- Measures how frequently the Gadget jams, breaks down, or malfunctions
- **Lower R# = More Reliable**
- Some Gadgets have **no R#** = never break down (e.g., Green Lantern's Power Ring)

### Reliability and Dice Actions

When using a Gadget for a Dice Action:
1. Roll the first die roll to resolve the Action
2. If the roll is **≤ R#**, the Gadget breaks down
3. The Action is **immediately canceled**
4. Only checked on the **first roll** (before rolling due to doubles)

**Example**: Joe's stun gun has R# 4. He rolls a 2 on first roll → Gun breaks down, Action canceled. If he rolled double 3's first, then 4 on second roll → No breakdown (4 wasn't the first roll).

### Reliability and Automatic Actions

For Automatic Actions (15 APs or less):
1. **First use each day**: Roll 2d10
2. If roll ≤ R#, Gadget breaks down and Automatic Action is canceled
3. **Each Ability only checked once per day**
4. After first check, can use that Ability for rest of day without further checks

**Example**: Black Canary starts car in morning (Automatic Action) → Check R#. Thereafter, drives all day without checking. First time she turns on radio (different Ability) → Check R# again. Then can use radio rest of day.

### Reliability Failure and Breakdown

When a Gadget fails R# check:
- APs of Ability/Abilities involved in the Action are **instantly reduced to 0 APs**
- Gadget must be **Repaired** before broken Ability can be used again

**Examples**:
- Car fails R# when starting → Running Power reduced to 0 APs
- Submachine gun fails R# during attack → Both AV and EV reduced to 0 APs

---

## C. Gadgets vs GADGETS

Naming convention identifies whether Gadgets can be Taken Away in combat using Trick Shot or Take Away maneuver.

### Mixed Case (e.g., Batarang, Submachinegun)
- **CAN be Taken Away** in combat
- Usually handheld items

### ALL CAPITALS (e.g., TRANK GUN, BATTLESUIT)
- **CANNOT be Taken Away** in combat
- Usually vehicles, armor, or large items

This property is **defined when the Gadget is built**.

---

## D. Gadgets and Damage

Gadgets take damage like Characters but with important differences.

### Tracking Damage
- Keep track of Gadget's **Current BODY Condition**
- Unlike Characters, Current BODY can be reduced **below zero** in normal combat

### OV/RV for Attacks on Objects

**Inanimate Objects** (only has non-substitutable BODY):
- OV/RV = BODY/BODY
- Examples: walls, trees, mailboxes, buildings
- 1 RAP creates hole large enough to walk through
- Object still functions after hole created

**Gadgets** (have Abilities beyond BODY):
- OV/RV = **BODY/variable** (more vulnerable)
- Examples: cars, robots, guns, Batarangs
- More vulnerable due to moving parts and complex systems
- Can be disabled by damaging specific components

### Hardened Defenses

During Gadget construction:
- Pay **+2 to Factor Cost of BODY** to make Gadget Hardened
- Hardened Gadgets must be reduced to 0 BODY to disable
- Normal Gadgets can be disabled by creating holes/removing components

### Gadget Destruction Thresholds

- **Current BODY = 0 or below**: Gadget ceases to function, must be Repaired
- **Current BODY = -(BODY rating)**: Gadget permanently destroyed, **cannot be Repaired**
  - *Example*: Gadget with BODY 5 is destroyed forever at Current BODY -5

### Vulnerability to Damage Types

- **All Gadgets**: Vulnerable to Physical damage (have BODY)
- **Mental damage**: Only if Gadget has MIND
- **Mystical damage**: Only if Gadget has SPIRIT

### Reliability and Damage

As Gadgets take damage, they become more prone to breakdown:
- **R# increases by 1 for each RAP of damage taken**

**Example**: Car with BODY 5 and R# 2 takes 3 RAPs of damage → R# increases to 5 (2+3)

**Note**: Gadgets with R# 0 (or no R#) are not affected by this rule.

---

## E. Hero Points and Gadgets

### Spending Hero Points

Users may spend Hero Points to:
- Increase Acting Value, Effect Value, Opposing Value, and Resistance Value in Dice Actions
- Works just like normal Abilities used in Dice Actions

### Pushing Gadget Abilities

Automatic Powers and Attributes can be Pushed (see page 89):
- **Failed Push**: Ability being Pushed is instantly reduced to **0 APs**
- Gadget must be **Repaired** before it functions again

---

# II. Building Gadgets

Characters with **Gadgetry Skill** can create new Gadgets during play.

## Five-Step Process

1. Design the Gadget and decide if it can be Taken Away
2. Get GM approval
3. Calculate Hero Point Cost
4. Buy parts
5. Add Powers and Attributes to the Gadget (Construction)

---

## Step 1: Design the Gadget

Decide exactly what Powers, Skills, and Attributes the Gadget will have and assign AP values to each.

### Design Examples

**CAR (STR: 4, BODY: 5, Running: 7, Radar Sense: 5, Heat Vision: 7)**
- BODY (required)
- Running (movement)
- STR (carrying capacity)
- Radar Sense (detection)
- Heat Vision (weapon)
- Name in capitals = cannot be Taken Away

**Gas Mask (BODY: 2, Sealed Systems: 9)**
- BODY (required)
- Sealed Systems (protection from gas)
- Name mixed case = can be Taken Away

**Revolver (BODY: 4, EV: 4, Range: 4)**
- Can assign AV, EV, Range directly instead of specific Powers
- Common for mundane weapons

### Adding Drawbacks

Drawbacks limit Gadget performance and reduce Hero Point cost:
- Must be logical and appropriate (GM approval required)
- Examples: Ammo Restriction, recharge time, usage limitations
- **Bad example**: "Only fired by persons born on Tuesday" (too arbitrary)

### Adding Bonuses

Bonuses make Gadget more powerful but increase Factor Cost:
- Applied to specific Abilities
- Increase Factor Cost of that Ability

### Deciding Take Away Status

Use common sense:
- **Cannot be Taken Away (ALL CAPS)**: Cars, battlesuits, large items
- **Can be Taken Away (mixed case)**: Handheld items like rings, Batarangs, guns

---

## Step 2: Allow the GM to Approve the Gadget

GM reviews the design and determines:

### Feasibility Check
- Reject if too powerful or unlimited in scope
- Reject if silly or impossible (e.g., car with italicized STR and WILL)
- Verify Drawbacks actually limit performance
- Rejected Gadgets may be redesigned or outlawed

### Genius Advantage Requirement

**Simple Rule**: If device cannot be built right now in late 20th century real world, Character must have **Genius Advantage**.

**Does NOT need Genius**:
- Car with radar (we can build radars now)

**NEEDS Genius**:
- Force field belts
- Teleportation machines
- Invisibility belts
- Laser pistols

GM has final say. Players may present scientific journals or articles to support feasibility.

---

## Step 3: Calculate Hero Point Cost

Calculate as if Gadget were a Character using Chapter Two rules.

### Basic Calculation

For each Ability:
1. Look up on AP Purchase Chart
2. Cross-index Factor Cost with APs purchased
3. Include Factor Cost modifiers from Bonuses/Limitations
4. Include Base Cost of Powers and Skills (Attributes have Base Cost 0)

### Reliability Number Modifier

Choose R# from table below. **All Abilities** get the Factor Cost modifier.

| Reliability Number | Factor Cost Modifier |
| ------------------ | -------------------- |
| 0                  | +3                   |
| 2                  | +2                   |
| 3                  | +1                   |
| 5                  | 0                    |
| 7                  | -1                   |
| 9                  | -2                   |
| 11                 | -3                   |

### Special Factor Cost Modifiers

- **Italicized Attribute**: +2 to Factor Cost of that Attribute
- **Hardened Defenses**: +2 to Factor Cost of BODY

### AV, EV, and Range

May be purchased individually:
- **Base Cost**: 5 each
- **Factor Cost**: 1 each

### Drawbacks

Subtract HP from Gadget cost for each Drawback:
- **Maximum reduction**: 50% of cost without Drawbacks (round up)
- *Example*: 33 HP Gadget with two 10-point Drawbacks = 17 HP final (not 13)

### Ammunition Restriction (Special Drawback)

Gadget can only be used X times before reloading:
- Reloading = Automatic Action
- Cannot perform Dice Action during reload phase

**Ammo Table**

| Ammo Rating | Hero Point Bonus |
| ----------- | ---------------- |
| 1           | 20               |
| 4           | 10               |
| 5           | 8                |
| 6           | 6                |
| 8           | 5                |
| 10          | 4                |
| 12          | 3                |
| 15          | 2                |
| 20          | 1                |

### Gadget Bonus (FINAL STEP)

Divide total Hero Point Cost by Gadget Bonus:
- **Can be Taken Away**: Divide by **2** (round up)
- **Cannot be Taken Away**: Divide by **4** (round up)

**ALWAYS the last step in calculating cost.**

### Complete Example: Machinegun

**Machinegun (BODY: 6, AV: 5, EV: 5, Range: 5, Ammo: 10, R#: 2)**

1. **AV**: FC 1 + 2 (R#) = FC 3 → 5 APs at FC 3 = 42 HP
2. **EV**: FC 1 + 2 (R#) = FC 3 → 5 APs at FC 3 = 42 HP
3. **Range**: FC 1 + 2 (R#) = FC 3 → 5 APs at FC 3 = 42 HP
4. **BODY**: FC 6 + 2 (R#) = FC 8 → 6 APs at FC 8 = 48 HP
5. **Base Costs**: AV (5) + EV (5) + Range (5) + BODY (0) = 15 HP
6. **Subtotal**: 42 + 42 + 42 + 48 + 15 = 189 HP
7. **Ammo Drawback**: 189 - 4 = 185 HP
8. **Gadget Bonus**: 185 ÷ 4 = 46.25 → **47 HP** (cannot be Taken Away)

---

## Step 4: Buy Parts

Purchase parts and equipment via Wealth Check (page 124).

### Dollar Cost Formula

**Dollar cost = Highest AP rating + 1 for each additional Ability**

**Example**: Gadget with highest Ability 8 APs and 5 total Abilities = 8 + 4 = 12 APs of Wealth

### Failed Wealth Check

If Wealth Check fails (no positive RAPs):
- Cannot begin construction
- Must wait for more Hero Points or Wealth
- Can spend Hero Points to increase Wealth (Chapter Eight)

### Successful Wealth Check

Construction may begin immediately.

---

## Step 5: Constructing the Gadget

Each Ability must be installed separately.

### Installation Order

1. **BODY must be installed first**
2. All other Abilities may be installed in any order

### Installation as Dice Action

**AV/EV**: Gadgetry Skill APs
**OV/RV**: APs of Ability being installed

**Success**: Ability installed
**Failure**: Must retry installation, **R# of Gadget decreases by 1**

### Time Calculation

**Base time**: 18 APs
**Formula**: Time = 18 + APs of Ability - RAPs earned

**Automatic Success**: If OV ≤ 0 (Gadgetry Skill >> Ability APs), installation is instant

**Example**: Installing 5 AP Ability with 15 AP Gadgetry:
- Roll yields 8 RAPs
- Time = 18 + 5 - 8 = 15 APs

### Gadget Completion

Gadget **cannot be used** until **all Abilities** in original design are successfully installed.

---

## Laboratories

Laboratories make Gadget production more efficient.

### Lab Rating

**Lab rating** = Maximum APs of Gadget Ability that may be built there
- *Example*: 5 AP Lab can only build Abilities up to 5 APs
- R# of Gadget **not affected** by Lab rating

### Lab Bonus

If Lab rating ≥ APs of Ability being installed:
- **+2 Column Shifts to the right** for both OV and RV
- Makes installation easier and faster

### Building a Laboratory

**Decide AP rating** before building
**Build time**: Equal to AP rating (minimum 19 APs)
**Cost**: Factor Cost 3 column × AP rating
**Reliability**: All Labs have R# 0

### Laboratory Maintenance

Must make periodic **Maintenance Check**:
- **OV/RV**: Equal to Lab APs
- **Positive RAPs**: Success, lab functions normally
- **Negative RAPs**: Lab in disrepair, cannot build Gadgets

**Repair Cost**: Pay Hero Points equal to **half Lab AP rating** (round up)

---

## Multiple Gadgeteers

### Working on Separate Abilities

- Each gadgeteer installs different Ability simultaneously
- Resolve each attempt separately
- Gadget completed in less total time

### Teamwork on Same Ability

- **AV/EV**: Highest Gadgetry Skill among team
- **Bonus**: +2 Column Shifts to the right for both OV and RV
- Installation completed faster than solo work

---

## Example: Lex Luthor's Giant Robot

### Design

**Giant Robot**
- DEX: 10, STR: 20, BODY: 15
- INT: 5, WILL: 5, MIND: 5
- Bomb: 20, Skin Armor: 5
- R#: 5
- Limitation: susceptible to own Bomb explosion
- Drawback: must recharge every 24 hours

### Costs

**Before Gadget Bonus**: 2,200 HP
**Gadget Bonus**: ÷4 (cannot be Taken Away)
**Final Cost**: 550 HP

### Parts

**Wealth Check**: 25 APs (highest Ability 20 + 5 additional Abilities)

### Construction

**Lex Luthor**: Gadgetry 15 APs
**Brian Lally**: Gadgetry 8 APs (assistant)

1. **BODY 15**: AV/EV 15/15, OV/RV 15/15 → Success in 8 APs
2. **STR 20**: AV/EV 15/15, OV/RV 20/20 → Success in 14 APs
3. **Skin Armor 5**: Lally assists (+2 CS bonus) → Success
4. **Bomb 20**: AV/EV 15/15, OV/RV 20/20 → First attempt fails (R# reduced to 4), second attempt succeeds

---

## Summary Tables

### Factor Cost Modifiers by R#

| R# | FC Modifier |
| -- | ----------- |
| 0  | +3          |
| 2  | +2          |
| 3  | +1          |
| 5  | 0           |
| 7  | -1          |
| 9  | -2          |
| 11 | -3          |

### Gadget Bonus

| Can be Taken Away? | Divide Cost By |
| ------------------ | -------------- |
| Yes (mixed case)   | 2              |
| No (ALL CAPS)      | 4              |

### Quick Reference: Building Steps

1. **Design**: List all Abilities with APs, choose Take Away status
2. **GM Approval**: Check feasibility, Genius requirement
3. **Calculate Cost**: AP Chart + R# modifier + Bonuses/Drawbacks + Gadget Bonus
4. **Buy Parts**: Wealth Check (highest AP + additional Abilities)
5. **Install**: BODY first, then others (Gadgetry Skill vs Ability APs)

---

## Important Rules Summary

- Gadgets **substitute** for user's Abilities (never add)
- **Italicized Attributes** work in all situations
- **Non-italicized Attributes** only work in specific circumstances
- R# increases by 1 per RAP of damage taken
- Failed Push or R# check reduces Ability to 0 APs
- Gadget destroyed permanently at Current BODY = -(BODY rating)
- **Always calculate Gadget Bonus last** when determining cost
- **Always install BODY first** when constructing
- Labs provide +2 CS bonus if Lab rating ≥ Ability APs
