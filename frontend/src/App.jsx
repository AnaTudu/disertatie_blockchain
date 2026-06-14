import { useState } from "react";
import { ethers } from "ethers";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState("");
  const [lastValidInfo, setLastValidInfo] = useState(null);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const shortContractAddress = contractAddress.substring(0, 6) + "..." + contractAddress.substring(contractAddress.length - 4);

  const abi = [
    "function registerDocument(string memory _fileHash) public",
    "function verifyDocument(string memory _fileHash) public view returns (bool)",
    "function getDocumentInfo(string memory _fileHash) public view returns (bool,address,uint256)"
  ];

  function handleFileChange(event) {
    setFile(event.target.files[0]);
    setMessage("");
    setHash("");
    setStatus("");
  }

 async function calculateHash(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    throw new Error(
      "Fișierul nu a putut fi citit. Selectează din nou documentul modificat."
    );
  }
}
  async function getContract(withSigner = false) {
    if (!window.ethereum) {
      throw new Error("MetaMask nu este instalat.");
    }
    //conexiune aplicatie-blockchain prin MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner(); 
    const userAddress = await signer.getAddress();
    setAccount(userAddress);

    if (withSigner) {
      return new ethers.Contract(contractAddress, abi, signer);
    }

    return new ethers.Contract(contractAddress, abi, provider);
  }

  async function registerDocument() {
  if (!file) {
    setMessage("Selectează un fișier înainte de înregistrare.");
    setStatus("warning");
    return;
  }

  try {
    setMessage("Se calculează hash-ul documentului...");
    setStatus("loading");

    const fileHash = await calculateHash(file);
    setHash(fileHash);

    const contract = await getContract(true);

    const info = await contract.getDocumentInfo(fileHash);
    const exists = info[0];

    if (exists) {
      setMessage("Documentul este deja înregistrat în blockchain.");
      setStatus("warning");
      return;
    }

    setMessage("Se trimite tranzacția către smart contract...");
    const tx = await contract.registerDocument(fileHash);

    setMessage("Se așteaptă confirmarea tranzacției...");
    await tx.wait();

    setMessage("Document înregistrat cu succes în blockchain!");
    setStatus("success");
  } catch (error) {
    console.error("EROARE INREGISTRARE:", error);

    setMessage(
      error.shortMessage ||
        error.reason ||
        error.message ||
        "Eroare la înregistrarea documentului."
    );

    setStatus("error");
  }
}

  async function verifyDocument() {
  if (!file) {
    setMessage("Selectează un fișier înainte de verificare.");
    setStatus("warning");
    return;
  }

  try {
    setMessage("Se recalculează hash-ul documentului...");
    setStatus("loading");

    let fileHash;

    try {
      fileHash = await calculateHash(file);
    } catch (readError) {
      console.error(readError);
      setMessage(
        "Documentul nu a putut fi citit. Dacă l-ai modificat, selectează din nou fișierul și apasă Verifică document."
      );
      setStatus("error");
      return;
    }

    setHash(fileHash);

    const contract = await getContract(false);
    const info = await contract.getDocumentInfo(fileHash);

    const exists = info[0];
    const owner = info[1];
    const timestamp = Number(info[2]);

        if (exists) {
          const date = new Date(timestamp * 1000);

          const shortOwner =
            owner.substring(0, 6) + "..." + owner.substring(owner.length - 4);

          setLastValidInfo({
            date: date.toLocaleString("ro-RO"),
            owner: shortOwner
          });

          setMessage(
            `✓ Document autentic

        Hash-ul există în blockchain.

        Data înregistrării:
        ${date.toLocaleString("ro-RO")}

        Proprietar:
        ${shortOwner}`
          );

          setStatus("success");
        } else {
          if (lastValidInfo) {
            setMessage(
              `Documentul a fost modificat sau nu este înregistrat în blockchain.

        Ultima versiune validă cunoscută:

        Data înregistrării:
        ${lastValidInfo.date}

        Proprietar:
        ${lastValidInfo.owner}

        Documentul poate fi înregistrat ca versiune nouă.`
            );
          } else {
            setMessage(
              "Documentul a fost modificat sau nu este înregistrat în blockchain. Îl poți înregistra ca versiune nouă."
            );
          }

          setStatus("error");
        }
  } catch (error) {
    console.error(error);
    setMessage(
      error.shortMessage ||
        error.reason ||
        error.message ||
        "Eroare la verificarea documentului."
    );
    setStatus("error");
  }
}

  const messageStyle = {
    padding: "14px",
    borderRadius: "10px",
    marginTop: "20px",
    fontWeight: "600",
    backgroundColor:
      status === "success"
        ? "#dcfce7"
        : status === "error"
        ? "#fee2e2"
        : status === "warning"
        ? "#fef3c7"
        : status === "loading"
        ? "#dbeafe"
        : "#f1f5f9",
    color:
      status === "success"
        ? "#166534"
        : status === "error"
        ? "#991b1b"
        : status === "warning"
        ? "#92400e"
        : status === "loading"
        ? "#1e40af"
        : "#334155"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3a8a, #6d28d9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: "30px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ marginBottom: "10px", color: "#0f172a" }}>
            Blockchain Document Verification
          </h1>
          <p style={{ color: "#64748b", fontSize: "16px" }}>
            Aplicație web pentru verificarea integrității documentelor utilizând blockchain și smart contracts.
          </p>
        </div>

        <div
          style={{
            border: "2px dashed #94a3b8",
            borderRadius: "18px",
            padding: "30px",
            textAlign: "center",
            backgroundColor: "#f8fafc",
            marginBottom: "25px"
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "10px" }}>📄</div>

          <label
  htmlFor="fileInput"
  style={{
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "white",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "18px"
  }}
>
  Alege documentul
</label>

    <input
  id="fileInput"
  type="file"
  style={{ display: "none" }}
  onChange={(e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setMessage("");
    setHash("");
    setStatus("");

    e.target.value = null;
  }}
/>

    {file && (
      <p
        style={{
          marginTop: "15px",
          color: "#334155",
          fontSize: "16px"
        }}
      >
        Document selectat: <strong>{file.name}</strong>
      </p>
    )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "15px",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "20px"
              }}
            >
              <button
                onClick={registerDocument}
                style={{
                  padding: "14px 24px",
                  border: "none",
                  borderRadius: "10px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "15px"
                }}
              >
            Înregistrează document
          </button>

          <button
            onClick={verifyDocument}
            style={{
              padding: "14px 24px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#7c3aed",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "15px"
            }}
          >
            Verifică document
          </button>
        </div>

        {message && (
            <div
              style={{
                ...messageStyle,
                whiteSpace: "pre-line"
              }}
            >
              {message}
            </div>
          )}

        {hash && (
          <div
            style={{
              marginTop: "25px",
              backgroundColor: "#f1f5f9",
              padding: "18px",
              borderRadius: "12px"
            }}
          >
            <h3 style={{ marginTop: 0, color: "#0f172a" }}>
              Hash SHA-256
            </h3>
            <p
              style={{
                wordBreak: "break-all",
                fontFamily: "monospace",
                color: "#334155"
              }}
            >
              {hash}
            </p>
          </div>
        )}

        <div
          style={{
            marginTop: "30px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px"
          }}
        >
          <div
            style={{
              backgroundColor: "#eff6ff",
              padding: "16px",
              borderRadius: "12px"
            }}
          >
            <strong>Rețea:</strong>
            <p>Hardhat Local</p>
          </div>

          <div
            style={{
              backgroundColor: "#f5f3ff",
              padding: "16px",
              borderRadius: "12px"
            }}
          >
            <strong>Smart Contract:</strong>
            <p style={{ wordBreak: "break-all" }}>{shortContractAddress}</p>
          </div>

          <div
            style={{
              backgroundColor: "#ecfdf5",
              padding: "16px",
              borderRadius: "12px"
            }}
          >
            <strong>Wallet conectat:</strong>
            <p style={{ wordBreak: "break-all" }}>
              {account || "Neconectat"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;