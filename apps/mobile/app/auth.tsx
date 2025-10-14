// app/auth.tsx
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { auth, db, firestore, signInEmail, signUpEmail } from "@/lib/firebase";

export default function AuthScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async () => {
    const e = email.trim();
    setError(null);
    if (!e || !password) return setError("Please fill in all the fields!");
    if (password.length < 6) return setError("The password should have at least 6 characters.");

    try {
      setSubmitting(true);
      if (isSignUp) {
        await signUpEmail(e, password);
      } else {
        await signInEmail(e, password);
      }

      // Optional: upsert user doc
      const uid = auth.currentUser?.uid;
      if (uid) {
        await db.collection("users").doc(uid).set(
          {
            email: auth.currentUser?.email ?? e,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchMode = () => setIsSignUp((prev) => !prev);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title} variant="headlineMedium">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>

        <TextInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          label="Password"
          mode="outlined"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />


        {!!error && <Text style={{ color: theme.colors.error }}>{error}</Text>}

        <Button
          mode="contained"
          style={styles.button}
          onPress={handleAuth}
          loading={submitting}
          disabled={submitting}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button mode="text" onPress={handleSwitchMode} style={styles.switchModeButton}>
          {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: { flex: 1, padding: 15, justifyContent: "center" },
  title: { textAlign: "center", marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { marginBottom: 24 },
  switchModeButton: {},
});






// import React, { useState } from "react";
// import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
// import { Text, TextInput, Button, useTheme } from 'react-native-paper' ;
// export default function AuthScreen(){
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isSignUp, setIsSignUp] = useState<boolean>(false);
//     const [error, setError] = useState<string | null>("")
//     const handleAuth = async () => {
//         if(!email || !password){
//             setError("Please fill in all the fields!");
//             return;
//         }
//         if(password.length < 6){
//             setError("The password should have atleast 6 characters.");
//             return;
        
//         }
//         setError(null);

//     };


//     const theme = useTheme();
    
//     const handleSwitchMode = async () =>{
//         setIsSignUp((prev)=> !prev);
//     };
//     return (
//     <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : "height"} style={styles.container}>
//         <View style ={styles.content}>
//             <Text style={styles.title} variant="headlineMedium">{ isSignUp? "Create Account" : "Welcome Back"}</Text>
//             <TextInput label="Email" autoCapitalize="none" keyboardType="email-address" 
//             placeholder="example@gmail.com" mode="outlined" style={styles.input} onChangeText={setEmail} />
//             <TextInput label="Password" autoCapitalize="none" keyboardType="email-address" 
//             mode="outlined" style={styles.input} onChangeText={setPassword} />
//             {error && (
//                 <Text style={{color: theme.colors.error}}>{error}</Text>
//             )}
//             <Button mode="contained" style={styles.button} onPress={handleAuth}> {isSignUp? "Sign Up": "Sign In"  } </Button>
//             <Button mode="text" onPress={handleSwitchMode} style={styles.switchModeButton}> {isSignUp? "Already have an account? Log in": "Don't have an account? Sign Up"}</Button>
//         </View>
//     </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: "white",
//     },
//     content:{
//         flex: 1,
//         padding: 15,
//         justifyContent: "center",
//     },
//     title:{
//         textAlign: "center",
//         marginBottom: 24,
//     },
//     input:{
//         marginBottom: 16,
//     },
//     button:{
//         textAlign: "center",
//         marginBottom: 24,
//     },
//     switchModeButton:{

//     },
// });