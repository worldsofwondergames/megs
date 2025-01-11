# MEGS System

![Foundry v12](https://img.shields.io/badge/foundry-v12-green)


![Mutiversal Exponential Gaming System](https://github.com/codemonkey1972/megs/blob/main/assets/images/megs-logo-multiversal.jpg?raw=true)

## What is DC Heroes?

[DC Heroes](https://en.wikipedia.org/wiki/DC_Heroes) is an out-of-print superhero role-playing game set in the superhero DC Universe and published by Mayfair Games that a lot of people consider the best superhero RPG ever created. Depending on who you talk to, 3.5 or 4 editions were published between 1985 and 1993.

### Wait: 3.5 or 4 editions?

[The Batman Role-Playing Game](https://en.wikipedia.org/wiki/Batman_Role-Playing_Game) was a simplified DC Heroes rules set with a few new rules put out in 1989, between the 1st and 2nd editions of DC Heroes and coincidentally at the same time as the first Tim Burton Batman movie came out.

### What does it have to do with West End Games' DC Universe RPG or Green Ronin's DC Adventures?

Nothing aside from using the same characters. Those are two completely distinct rule sets (though DC Adventures and 3rd Edition Mutants and Masterminds do borrow some mechanics).

### What about Blood of Heroes?

Mayfair licensed the DC Heroes game mechanics and text to Pulsar Games, who produced two editions of an RPG called [Blood of Heroes](https://en.wikipedia.org/wiki/Blood_of_Heroes_(role-playing_game)) in 1998 and 2000 using the DC Heroes text with original characters replacing the DC characters and a few minor rules changes. 

However, it was discovered that Mayfair had no rights to the DC Heroes game or text in the first place; the rights remained with DC Comics and their parent corporation Warner Brothers. Further publication was suspended, and Pulsar Games went under a few years later.

### And Underground?

In 1993, Mayfair published a "grim and gritty" superhero-ish RPG named [Underground](https://en.wikipedia.org/wiki/Underground_(role-playing_game)) that used similar rules to DC Heroes. It's sometimes considered a successor to DC Heroes, though it was last published in 1996.

Mayfair eventually sold off all its IP to Asmodee... which is a whole 'nother FAQ on its own.

## What is MEGS?

The core mechanics of the DC Heroes / Underground / Blood of Heroes games was dubbed "MEGS" by its fans, short for ["Mayfair Eponential Gaming System."](https://en.wikipedia.org/wiki/Mayfair_Exponential_Game_System) This was an informal name, never trademarked.

### But wait: You're calling this the "Multiversal Exponential Gaming System"?

Yeah. While MEGS is not anyone's intellectual property, "Mayfair" is. And since this is a generic representation of a game system spanning 3 games, 5-ish companies, and 4 decades, I'm trying really hard not to get sued for using anyone's IP. 

### Is that likely to happen?

Probably not. I could be paranoid from being married to a prospective lawyer, and I'll be delighted if three dozen people not related to me are even aware this exists. But there's nothing like a cease-and-desist letter from a multimillion dollar legal firm contracted by a multibillion dollar international corporation to ruin your blood pressure, so, why chance it?

Which bring us to...

## So how are you able to publish this?

Caveat: I am not a lawyer and this is not legal advice.

This is an unofficial, fan-made representation of the MEGS rule set. I'm producing it under the fair use clause. 

Also, game rules and math are not copyrightable, only the specific implementation of them is. So, the math for the Action and Effect Tables is fair game; the text and example(s) explaining them from the rules books, no. 

In short, I'm not reproducing anything anyone else legally owns for publication as part of this Foundry VTT system.

### Is that why the system doesn't contain the skills text, powers text, etc.?

Yep.

### Is that why you aren't calling the system "DC Heroes" or "Mayfair, etc."?

You're getting it.

### Is that why you haven't packaged up any existing characters, artwork, adventures-

You got it. Let's move on.

## What is the Multiversal Exponential Gaming System system for Foundry Virtual Tabletop?

It's a mouthful, is what it is. Let's go with "MEGS for Foundry."

The current version (0.5.1) of MEGS for Foundry has basic character sheets, some die rolling, outcome resolution, and a generic skill tree. It allows you to create heroes, villains, NPCs, powers, gadgets, character traits, power modifications, etc. It's very much a skeleton for running games featuring any superheroes (or villains; I don't discriminate) you want using MEGS at a level similar to DC Heroes 3rd Edition.

It's also a work in progress. I basically tackled it on a whim to teach myself to code the Foundry framework. I will try very hard to make any changes backward compatible so that you can use any characters or items you create after later versions, but... not promising anything until we get out of beta.

### Are there any changes to this ruleset unique to MEGS for Foundry?

There are a few because of technical and/or design constraints of the platform:
- Advantages and Drawbacks are grouped as "Traits" for ease of reference.
- Bonuses and Limitations are grouped as "Modifiers" for ease of reference.
- Certain Powers from other products (ex: Mystic Link from DCH3E) will need to be modeled as Advantages rather than Powers because the current model doesn't allow piggybacking Powers on top of each other.
- Vehicles should be created as both Items and Characters. More on this as we approach 1.0.

### Do you have future plans?

Do I ever! MEGS for Foundry is currently sitting at **version 0.5.1**.

(Note that everything below is subject to change.)

**Version 0.5.2** (aiming for end of year 2024) deals with a lot of Foundry technical implementation details you won't care about. Suffice it to say some of the code is... not great, either because I didn't know the best way to do it in Foundry, or because it was 3 AM and I just needed whatever I was working on done so I could get a few hours of sleep before work.
- Adding an edit lock feature for the page
- Several miscellaneous upgrades and fixes

Issues are tracked [here](https://github.com/codemonkey1972/megs/issues?q=is%3Aopen%20is%3Aissue%20project%3Acodemonkey1972%2F4).

Then... **version 1.0.0**, probably around March 2025. Incorporating any feedback I've gotten and:
- Active Effects (basically automating the effects of powers, gadgets, etc. when placed in a character's inventory)
- Adding character builder/creator view for characters
- Probably a look-and-feel overhaul since the current UI is pretty generic (I'm a programmer, not a designer)

And then I rest for a very, very long time. At least until...

## What's "Legacy of Heroes"?

Well... that would be telling. Until it gets more definite, I'd prefer to say [nothing](https://en.wikipedia.org/wiki/Dungeons_%26_Dragons_retro-clones).

Nothing at all...

## Wow, this is the greatest thing ever and thanks to you I can now realize my childhood dream of playing Superman in the MEGS system! How can I ever repay you?

I have a [KoFi](https://ko-fi.com/worldsofwonder) if you really want to kick me a few bucks.

Alternately, Legacy of Heroes will be a thing eventually...
