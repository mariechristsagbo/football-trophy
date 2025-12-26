const CONFIGURATION_DU_JEU = {
  largeurScene: 300,
  hauteurScene: 500,
  tailleGardien: 48,
  tailleBalle: 36,
  vitesseInitiale: 2,
  intervalleDeCreationBalles: 2000,
  delaiAnimationBalle: 2,
  incrementPosition: 1 
};

class ElementDuJeu {
  constructor(config) {
    this.ref = document.createElement('div');
    this.ref.className = 'game-element';
    this.ref.innerHTML = config.svg;
    this.ref.style.position = 'absolute';
    this.ref.style.backgroundColor = 'transparent';
    this.hauteur = config.height;
    this.largeur = config.width;
    this.positionActuelle = { x: 0, y: 0 };
  }

  ajouterAuDOM(parent) {
    if (this.ref && parent) {
      parent.appendChild(this.ref);
    }
  }

  retirerDuDOM() {
    if (this.ref && this.ref.parentElement) {
      this.ref.parentElement.removeChild(this.ref);
    }
  }

  deplacer(indexColonne, y) {
    this.positionActuelle.x = indexColonne;
    this.positionActuelle.y = y;
    const largeurColonne = CONFIGURATION_DU_JEU.largeurScene / 3;
    if (this.ref) {
      const gauche = indexColonne * largeurColonne + largeurColonne / 2 - this.largeur / 2;
      const haut = y - this.hauteur;
      this.ref.style.left = `${gauche}px`;
      this.ref.style.top = `${haut}px`;
    }
  }
}

class Balle extends ElementDuJeu {
  constructor() {
    const svgBalle = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volleyball"><path d="M11.1 7.1a16.55 16.55 0 0 1 10.9 4"/><path d="M12 12a12.6 12.6 0 0 1-8.7 5"/><path d="M16.8 13.6a16.55 16.55 0 0 1-9 7.5"/><path d="M20.7 17a12.8 12.8 0 0 0-8.7-5 13.3 13.3 0 0 1 0-10"/><path d="M6.3 3.8a16.55 16.55 0 0 0 1.9 11.5"/><circle cx="12" cy="12" r="10"/></svg>`;
    
    super({
      svg: svgBalle,
      height: CONFIGURATION_DU_JEU.tailleBalle,
      width: CONFIGURATION_DU_JEU.tailleBalle
    });

    this.intervalle = null;
    this.enPause = false;
    this.optionsCollisions = [];
    this.fonctionFinJeu = () => {};

    if (this.ref) {
      const colonneAleatoire = Math.floor(Math.random() * 3);
      this.deplacer(colonneAleatoire, -this.hauteur); 
      this.ref.style.transition = '0.2s';
    }
  }

  faireTomberBalle() {
    this.intervalle = setInterval(() => {
      if (this.enPause) return;

      if (this.positionActuelle.y > CONFIGURATION_DU_JEU.hauteurScene + 3 * CONFIGURATION_DU_JEU.tailleBalle) {
        clearInterval(this.intervalle);
        this.retirerDuDOM();
        this.fonctionFinJeu();
        return;
      }

      this.deplacer(this.positionActuelle.x, this.positionActuelle.y + CONFIGURATION_DU_JEU.incrementPosition);

      this.verifierCollisions();
    }, CONFIGURATION_DU_JEU.delaiAnimationBalle);
  }

  obtenirDecalageDirectionBalle() {
    if (this.positionActuelle.x === 0) return -1;
    if (this.positionActuelle.x === 2) return 1;
    return [-1, 1][Math.floor(Math.random() * 2)];
  }

  sortirBalle() {
    clearInterval(this.intervalle);
    if (!this.ref) return;

    this.ref.style.transition = '0.6s';

    const decalageDirection = this.obtenirDecalageDirectionBalle();
    const largeurColonne = CONFIGURATION_DU_JEU.largeurScene / 3;

    let colonneSortie;
    if (decalageDirection === -1) {
      colonneSortie = -1;
    } else {
      colonneSortie = 3;
    }

    const positionX = colonneSortie * largeurColonne + largeurColonne / 2 - this.largeur / 2;
    const positionYRemontee = this.positionActuelle.y - 4 * CONFIGURATION_DU_JEU.tailleBalle;

    this.ref.style.left = `${positionX}px`;
    this.ref.style.top = `${positionYRemontee - this.hauteur}px`;

    setTimeout(() => {
      this.retirerDuDOM();
    }, 600);
  }

  lorsCollisionAvec(cible, rappel) {
    this.optionsCollisions.push({ target: cible, callback: rappel });
  }

  verifierCollisions() {
    for (const collision of this.optionsCollisions) {
      const basBalle = this.positionActuelle.y - this.hauteur;
      const hautGardien = collision.target.positionActuelle.y;

      if (this.positionActuelle.x === collision.target.positionActuelle.x &&
          basBalle === hautGardien) {
        collision.callback();
      }
    }
  }

  lorsFinJeu(rappel) {
    this.fonctionFinJeu = rappel;
  }
}

class Gardien extends ElementDuJeu {
  constructor() {
    const svgGardien = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-person-standing"><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>`;

    super({
      svg: svgGardien,
      height: CONFIGURATION_DU_JEU.tailleGardien,
      width: CONFIGURATION_DU_JEU.tailleGardien
    });

    this.gestionnaireTouches = null;

    if (this.ref) {
      this.ref.style.transition = '0.2s';
    }
  }

  ecouterTouchesClavier() {
    const mapTouches = {
      'ArrowLeft': -1,
      'ArrowRight': 1
    };

    this.gestionnaireTouches = (e) => {
      const direction = mapTouches[e.key];
      if (direction !== undefined) {
        const nouvelleColonne = this.positionActuelle.x + direction;
        if (nouvelleColonne >= 0 && nouvelleColonne <= 2) {
          this.deplacer(nouvelleColonne, this.positionActuelle.y);
        }
      }
    };

    window.addEventListener('keydown', this.gestionnaireTouches);
  }

  nettoyerListeners() {
    if (this.gestionnaireTouches) {
      window.removeEventListener('keydown', this.gestionnaireTouches);
      this.gestionnaireTouches = null;
    }
  }

  deplacer(indexColonne, y) {
    if (indexColonne < 0 || indexColonne > 2) return;
    super.deplacer(indexColonne, y);
  }
}

class Jeu {
  constructor(scene, elementScore) {
    this.vitesse = CONFIGURATION_DU_JEU.vitesseInitiale;
    this.score = 0;
    this.intervalle = null;
    this.enCours = false;
    this.enDemarrage = false;
    this.jeuTermine = false;
    this.scene = scene;
    this.elementScore = elementScore;
    this.gardien = null;
    this.balles = [];

    this.initialiser();
  }

  initialiser() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        this.mettreEnPause();
      }
    });
  }

  afficherScore() {
    if (this.elementScore) {
      this.elementScore.innerHTML = String(this.score);
    }
    this.mettreAJourMeilleurScore();
  }

  mettreAJourMeilleurScore() {
    const meilleurActuel = parseInt(localStorage.getItem('bestScore')) || 0;
    if (this.score > meilleurActuel) {
      localStorage.setItem('bestScore', String(this.score));
    }
  }

  jouer() {
    this.score = 0;
    this.vitesse = CONFIGURATION_DU_JEU.vitesseInitiale;
    this.enCours = true;
    this.jeuTermine = false;
    this.balles = [];

    if (this.gardien) {
      this.gardien.nettoyerListeners();
    }

    if (this.scene && this.scene.ref) {
      const elementsExistants = this.scene.ref.querySelectorAll('.game-element');
      elementsExistants.forEach(el => el.remove());
    }

    if (this.intervalle) {
      clearInterval(this.intervalle);
      this.intervalle = null;
    }

    this.afficherScore();

    if (!this.scene || !this.scene.ref) {
      return;
    }

    this.gardien = new Gardien();
    this.gardien.ajouterAuDOM(this.scene.ref);
    this.gardien.deplacer(1, this.scene.hauteur);
    this.gardien.ecouterTouchesClavier();

    this.boucleBalles(this.scene.ref, this.gardien);
    this.animationBalle(this.scene.ref, this.gardien);

    this.enDemarrage = true;
  }

  mettreEnPause() {
    this.enCours = false;
    this.balles.forEach(balle => {
      balle.enPause = true;
    });
  }

  reprendre() {
    this.enCours = true;
    this.balles.forEach(balle => {
      balle.enPause = false;
    });
  }

  animationBalle(referenceScene, gardien) {
    const balle = new Balle();
    balle.ajouterAuDOM(referenceScene);
    
    if (!balle.ref || !balle.ref.parentElement) {
      return;
    }
    
    balle.faireTomberBalle();

    balle.lorsCollisionAvec(gardien, () => {
      this.score++;
      this.afficherScore();
      balle.sortirBalle();

      const ancienPalier = Math.floor((this.score - 1) / 5);
      const nouveauPalier = Math.floor(this.score / 5);

      if (nouveauPalier > ancienPalier) {
        this.vitesse = Math.max(0.5, this.vitesse - 0.05);
        clearInterval(this.intervalle);
        this.boucleBalles(referenceScene, gardien);
      }
    });

    balle.lorsFinJeu(() => {
      if (this.jeuTermine) return;

      this.jeuTermine = true;
      this.balles = [];
      alert('Game Over!');
      this.score = 0;
      this.afficherScore();
      this.vitesse = CONFIGURATION_DU_JEU.vitesseInitiale;
      this.enDemarrage = false;
      this.enCours = false;

      if (this.gardien) {
        this.gardien.nettoyerListeners();
      }
    });

    this.balles.push(balle);
  }

  boucleBalles(referenceScene, gardien) {
    if (this.intervalle) {
      clearInterval(this.intervalle);
    }
    
    this.intervalle = setInterval(() => {
      if (this.enCours) {
        this.animationBalle(referenceScene, gardien);
      }
    }, CONFIGURATION_DU_JEU.intervalleDeCreationBalles);
  }

}

function initialiser() {
  const elementScene = document.getElementById('scene');
  if (!elementScene) return;
  
  elementScene.style.position = 'relative';
  elementScene.style.width = `${CONFIGURATION_DU_JEU.largeurScene}px`;
  elementScene.style.height = `${CONFIGURATION_DU_JEU.hauteurScene}px`;
  
  const scene = {
    ref: elementScene,
    largeur: CONFIGURATION_DU_JEU.largeurScene,
    hauteur: CONFIGURATION_DU_JEU.hauteurScene
  };

  const elementScore = document.getElementById('score');
  if (!elementScore) return;

  const jeu = new Jeu(scene, elementScore);

  const gestionnairesBoutons = {
    'start': () => {
      if (!jeu.enDemarrage) {
        jeu.jouer();
        document.getElementById('start').classList.add('active');
        document.getElementById('pause').disabled = false;
        document.getElementById('play').disabled = true;
      }
    },
    'pause': () => {
      jeu.mettreEnPause();
      document.getElementById('pause').disabled = true;
      document.getElementById('play').disabled = false;
    },
    'play': () => {
      jeu.reprendre();
      document.getElementById('pause').disabled = false;
      document.getElementById('play').disabled = true;
    },
    'show-best-score': () => {
      const meilleurScore = localStorage.getItem('bestScore') || '0';
      alert(`Meilleur Score: ${meilleurScore}`);
    },
    'toggle-audio': () => {
    }
  };

  Object.keys(gestionnairesBoutons).forEach(identifiantBouton => {
    const bouton = document.getElementById(identifiantBouton);
    if (bouton) {
      bouton.addEventListener('click', gestionnairesBoutons[identifiantBouton]);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiser);
} else {
  initialiser();
}
