// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DocumentRegistry {

    struct Document {
        bool exists;
        address owner;
        uint256 timestamp;
    }

    mapping(string => Document) private documents;

    function registerDocument(
        string memory _fileHash
    ) public {

        require(
            !documents[_fileHash].exists,
            "Document already registered"
        );

        documents[_fileHash] = Document({
            exists: true,
            owner: msg.sender,
            timestamp: block.timestamp
        });
    }

    function verifyDocument(
        string memory _fileHash
    ) public view returns (bool) {

        return documents[_fileHash].exists;
    }

    function getDocumentInfo(
        string memory _fileHash
    )
        public
        view
        returns (
            bool exists,
            address owner,
            uint256 timestamp
        )
    {
        Document memory doc = documents[_fileHash];

        return (
            doc.exists,
            doc.owner,
            doc.timestamp
        );
    }
}