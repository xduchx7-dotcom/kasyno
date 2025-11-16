import fs from "fs";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { player, amount } = req.body;

    if (!player || !amount)
      return res.status(400).json({ error: "Brak danych" });

    // Wczytanie aktualnych płatności
    let file = [];
    try {
      file = JSON.parse(fs.readFileSync("płatności.json", "utf8"));
    } catch (e) {
      file = [];
    }

    // Dodanie nowej płatności
    file.push({
      player,
      amount,
      time: Date.now()
    });

    // Zapis do pliku
    fs.writeFileSync("płatności.json", JSON.stringify(file, null, 2));

    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    try {
      const file = JSON.parse(fs.readFileSync("płatności.json", "utf8"));
      return res.status(200).json(file);
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  return res.status(405).end();
}
