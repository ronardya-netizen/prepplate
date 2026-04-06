export type Lang = "en" | "fr";

export const t = {
  en: {
    nav: { home: "Home", pantry: "Pantry", plan: "Plan", profile: "Profile" },
    home: {
      greeting: (h: number) => h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening",
      subtitle: "What are we cooking today?",
      expiring: (n: number) => `${n} ingredient${n > 1 ? "s" : ""} expiring soon — use them first!`,
      mode: "Mode", cuisine: "Cuisine",
      suggestions: (n: number) => `${n} suggestion${n !== 1 ? "s" : ""}`,
      finding: "Finding meals…", findingLong: "Finding the best meals for you…",
      noMeals: "No meals found.", noMealsSub: "Try a different mode or add more ingredients to your pantry.",
      modes: [{ id: "all", label: "All" }, { id: "quick", label: "Quick" }, { id: "low-cal", label: "Low cal" }, { id: "high-protein", label: "High protein" }, { id: "comfort", label: "Comfort" }, { id: "healthy", label: "Healthy" }],
     cuisines: [ { id: "all", label: "All" }, { id: "italian", label: "Italian" },{ id: "french", label: "French" },{ id: "indian", label: "Indian" },{ id: "mexican", label: "Mexican" },{ id: "haitian", label: "Haitian" }, { id: "asian", label: "Asian" },{ id: "middle-eastern", label: "Middle Eastern" },{ id: "american", label: "American" }, { id: "african", label: "African" }],
    },
     pantry: {
      title: "My Pantry", allFresh: "all fresh", expiringSoon: (n: number) => `${n} expiring soon`,
      addItem: "+ Add item", search: "Search ingredients…", back: "Back", addToPantry: "Add to pantry",
      whenExpires: (name: string) => `When does ${name} expire?`,
      expiry: [{ label: "Today", days: 0 }, { label: "2 days", days: 2 }, { label: "This week", days: 7 }, { label: "2 weeks", days: 14 }, { label: "Staple", days: 999 }],
      empty: "Your pantry is empty", emptySub: "Add ingredients to get meal suggestions",
      sections: { red: "Expiring soon", yellow: "Use this week", green: "Staples" },
      expiresDay: "Expires today", daysLeft: (n: number) => `${n} days left`,
    },
    plan: {
      title: "Plan your next meal", subtitle: "See what to cook next & the best prices",
      postalSet: (p: string) => `Showing stores near ${p}`, postalEmpty: "Set your postal code",
      postalSub: "We'll show you the best nearby stores", change: "Change", add: "Add", cancel: "Cancel", save: "Save",
      storesNear: "Stores near you", mealsNext: "Meals you could cook next",
      need: (n: number) => `Need ${n} item${n > 1 ? "s" : ""}`, dealsAvailable: "deals available",
      groceryList: "Grocery list", itemsRemaining: (n: number) => `${n} items remaining`,
      bestPrice: "best price", bestPriceToday: "Best price today", buy: "Buy", sale: "sale",
    },
    profile: {
      title: "Profile", subtitle: "Your preferences",
      nutritionGoal: "Nutrition goal", none: "None", lowCal: "Low calorie", highProtein: "High protein",
      cuisines: "Preferred cuisines", budget: "Monthly grocery budget",
      frequency: "Grocery frequency", daily: "Daily", twiceWeek: "Twice a week", weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly",
      privacy: "Privacy", shareActivity: "Share activity anonymously", shareDesc: "Helps improve trending meals",
      yourId: "Your ID", save: "Save settings", saved: "Saved!",
      feedback: "Share feedback", feedbackSub: "Help us improve PrepPlate",
    },
    meal: {
      back: "Back", coverage: "Pantry coverage", ingredients: "Ingredients", steps: "Steps",
      missing: "missing", startCooking: "Start Cooking →",
    },
    cook: {
      exit: "Exit", step: (current: number, total: number) => `Step ${current} of ${total}`,
      startTimer: (t: string) => `Start timer — ${t}`, pause: "Pause", resume: "Resume",
      next: "Next step →", finish: "Finish cooking ✓",
    },
  },
  fr: {
    nav: { home: "Accueil", pantry: "Garde-manger", plan: "Planifier", profile: "Profil" },
    home: {
      greeting: (h: number) => h < 12 ? "Bonjour" : h < 17 ? "Bon après-midi" : "Bonsoir",
      subtitle: "Qu'est-ce qu'on cuisine aujourd'hui?",
      expiring: (n: number) => `${n} ingrédient${n > 1 ? "s" : ""} expire${n > 1 ? "nt" : ""} bientôt — utilisez-les en premier!`,
      mode: "Mode", cuisine: "Cuisine",
      suggestions: (n: number) => `${n} suggestion${n !== 1 ? "s" : ""}`,
      finding: "Recherche de repas…", findingLong: "Recherche des meilleurs repas pour vous…",
      noMeals: "Aucun repas trouvé.", noMealsSub: "Essayez un mode différent ou ajoutez plus d'ingrédients.",
      modes: [{ id: "all", label: "Tous" }, { id: "quick", label: "Rapide" }, { id: "low-cal", label: "Faible cal." }, { id: "high-protein", label: "Haute protéine" }, { id: "comfort", label: "Réconfort" }, { id: "healthy", label: "Santé" }],
      cuisines: [{ id: "all", label: "Toutes" },{ id: "italian", label: "Italienne" },{ id: "french", label: "Française" },{ id: "indian", label: "Indienne" },{ id: "mexican", label: "Mexicaine" },{ id: "haitian", label: "Haïtienne" },{ id: "asian", label: "Asiatique" },{ id: "middle-eastern", label: "Moyen-Orient" },{ id: "american", label: "Américaine" },{ id: "african", label: "Africaine" }],
    },
    pantry: {
      title: "Mon Garde-manger", allFresh: "tout frais", expiringSoon: (n: number) => `${n} expire${n > 1 ? "nt" : ""} bientôt`,
      addItem: "+ Ajouter", search: "Rechercher des ingrédients…", back: "Retour", addToPantry: "Ajouter au garde-manger",
      whenExpires: (name: string) => `Quand expire ${name}?`,
      expiry: [{ label: "Aujourd'hui", days: 0 }, { label: "2 jours", days: 2 }, { label: "Cette semaine", days: 7 }, { label: "2 semaines", days: 14 }, { label: "Essentiel", days: 999 }],
      empty: "Votre garde-manger est vide", emptySub: "Ajoutez des ingrédients pour obtenir des suggestions",
      sections: { red: "Expire bientôt", yellow: "À utiliser cette semaine", green: "Essentiels" },
      expiresDay: "Expire aujourd'hui", daysLeft: (n: number) => `${n} jour${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""}`,
    },
    plan: {
      title: "Planifiez votre prochain repas", subtitle: "Voyez quoi cuisiner et les meilleurs prix",
      postalSet: (p: string) => `Magasins près de ${p}`, postalEmpty: "Entrez votre code postal",
      postalSub: "Nous afficherons les meilleurs magasins près de chez vous", change: "Modifier", add: "Ajouter", cancel: "Annuler", save: "Sauvegarder",
      storesNear: "Magasins près de vous", mealsNext: "Repas que vous pourriez cuisiner",
      need: (n: number) => `Besoin de ${n} article${n > 1 ? "s" : ""}`, dealsAvailable: "rabais disponibles",
      groceryList: "Liste d'épicerie", itemsRemaining: (n: number) => `${n} article${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""}`,
      bestPrice: "meilleur prix", bestPriceToday: "Meilleur prix aujourd'hui", buy: "Acheter", sale: "rabais",
    },
    profile: {
      title: "Profil", subtitle: "Vos préférences",
      nutritionGoal: "Objectif nutritionnel", none: "Aucun", lowCal: "Faible calorie", highProtein: "Haute protéine",
      cuisines: "Cuisines préférées", budget: "Budget mensuel d'épicerie",
      frequency: "Fréquence d'épicerie", daily: "Quotidien", twiceWeek: "Deux fois par semaine", weekly: "Hebdomadaire", biweekly: "Bimensuel", monthly: "Mensuel",
      privacy: "Confidentialité", shareActivity: "Partager l'activité anonymement", shareDesc: "Aide à améliorer les repas tendance",
      yourId: "Votre ID", save: "Sauvegarder", saved: "Sauvegardé!",
      feedback: "Donner un avis", feedbackSub: "Aidez-nous à améliorer PrepPlate",
    },
    meal: {
      back: "Retour", coverage: "Couverture du garde-manger", ingredients: "Ingrédients", steps: "Étapes",
      missing: "manquant", startCooking: "Commencer à cuisiner →",
    },
    cook: {
      exit: "Quitter", step: (current: number, total: number) => `Étape ${current} sur ${total}`,
      startTimer: (t: string) => `Démarrer le minuteur — ${t}`, pause: "Pause", resume: "Reprendre",
      next: "Étape suivante →", finish: "Fin de la cuisson ✓",
    },
  },
};

export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  const settings = localStorage.getItem("prepplate-settings");
  if (!settings) return "en";
  return JSON.parse(settings).lang ?? "en";
}

