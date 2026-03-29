package tokens


import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    
    "golang.org/x/crypto/bcrypt"
)

func HashTokenWithPreHashSHA256(token string) (string, error) {
    hash := sha256.Sum256([]byte(token))
    hashStr := hex.EncodeToString(hash[:])
    
    bcryptHash, err := bcrypt.GenerateFromPassword([]byte(hashStr), bcrypt.DefaultCost)
    if err != nil {
        return "", err
    }
    
    return string(bcryptHash), nil
}

func VerifyTokenWithPreHashSHA256(token string, hashedToken string) (bool, error) {
    hash := sha256.Sum256([]byte(token))
    hashStr := hex.EncodeToString(hash[:])
    
    err := bcrypt.CompareHashAndPassword([]byte(hashedToken), []byte(hashStr))
    if err != nil {
        if err == bcrypt.ErrMismatchedHashAndPassword {
            return false, nil
        }
        return false, fmt.Errorf("verification failed: %w", err)
    }
    
    return true, nil
}