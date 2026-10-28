# Modèles d'IA utilisés par Huginn

- **BirdNET+ V3.0-preview3.1 Global 10K (pruned)** et **Géomodèle BirdNET+ V3.0.4** — BirdNET Team (K. Lisa Yang Center for Conservation Bioacoustics, Cornell Lab of Ornithology / Chemnitz University of Technology). Licence Apache 2.0. Source : https://github.com/birdnet-team/birdnet-live-app (assets/models). Poids FP16 d'origine ; graphe modifié pour calculer en FP32 (casts insérés après les poids) afin de tourner dans onnxruntime-web. Résultats vérifiés identiques au modèle d'origine (écart max 0,004).
- **Perch v2** — Google DeepMind. Licence Apache 2.0. Non stocké ici : téléchargé à la demande depuis https://huggingface.co/justinchuby/Perch-onnx (export ONNX) avec la liste des classes de https://huggingface.co/cgeorgiaw/Perch.
- Noms français : taxonomie BirdNET (taxonomy.csv du même dépôt).
