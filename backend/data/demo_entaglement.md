# Chapter 7 — Quantum Entanglement

*An introduction for students who have met the basics of quantum mechanics but not yet the things that make it strange.*

---

## 7.1 Why this chapter matters

Quantum entanglement is the single feature of quantum mechanics that Einstein found most disturbing. He called it "spooky action at a distance," and he meant the phrase as a complaint, not as a marketing slogan. For three decades after his complaint, the question of whether entanglement was real — in the strong sense of describing the world rather than describing our ignorance of it — was treated as philosophy rather than physics. It is now treated as engineering. Entanglement is the resource that powers quantum computers, quantum cryptography, and the most precise tests of physical law ever performed.

The goal of this chapter is to give you a working understanding of what entanglement is, what it is not, and why it forced physicists to give up at least one of three assumptions that had been considered obvious since Newton: that systems have definite properties before measurement, that influences travel no faster than light, or that experimenters are free to choose what to measure. We will build up to that conclusion slowly. By the end you should be able to describe the EPR paradox, state Bell's theorem in plain language, and explain why a violated Bell inequality is not the same as a transmitted message.

A word on prerequisites. You should be comfortable with the idea of a quantum state as a vector, with the basic notation of bras and kets, and with the idea that measurement returns probabilistic outcomes. You do not need to have seen tensor products before; we will introduce them in the next section. You do not need any relativity beyond the slogan "nothing travels faster than light."

---

## 7.2 Composite systems and the tensor product

Most of what makes entanglement strange comes from a single mathematical fact: when you put two quantum systems side by side, the state space of the combined system is not the sum of the two state spaces but their *product*. This is called the tensor product, and it is the technical heart of this chapter.

Suppose you have two coins, one in your left pocket and one in your right. Classically, each coin has two possible states — heads or tails — and the joint system has four: HH, HT, TH, TT. The number of joint states is the product of the individual counts. This much is unsurprising. Now suppose each coin is a quantum coin, with state space spanned by `|H⟩` and `|T⟩`. The joint state space is spanned by `|HH⟩`, `|HT⟩`, `|TH⟩`, and `|TT⟩`, exactly as before. So far there is nothing new.

The novelty appears when you allow superpositions. Classically, a coin is either heads or tails; if you do not know which, you have a probability distribution over the two. Quantum mechanics allows the coin itself to be in a superposition of `|H⟩` and `|T⟩`, in a precise sense that is more than ignorance. When you take the product of two quantum systems, the joint system can be in a superposition over all four basis states, and most of those superpositions cannot be written as a product of a state of the first system with a state of the second.

A state that *can* be written as such a product — for instance, a state where the left coin is in some superposition and the right coin is in some other superposition, independently — is called a *product state* or *separable state*. Every other state is called *entangled*. The defining feature of entanglement is therefore negative: an entangled state is one that cannot be decomposed into a description of the parts. There is no separate fact about the left coin and a separate fact about the right coin that, taken together, captures the joint state. The joint state contains correlations that are not reducible to properties of the parts.

This is a strong claim and you should not take it on faith. The next section makes it concrete with an example.

---

## 7.3 The Bell state

Consider the following two-qubit state, conventionally called the *singlet* or one of the *Bell states*:

`|Φ⟩ = (1/√2) ( |00⟩ + |11⟩ )`

Read this carefully. The notation `|00⟩` means the first qubit is in state `|0⟩` and the second qubit is also in state `|0⟩`. The notation `|11⟩` means both are in `|1⟩`. The factor `1/√2` is a normalization that ensures the total probability is one. So the state says, with equal amplitude, that both qubits are zero, or that both qubits are one.

The first thing to notice is what this state does *not* contain. It contains no `|01⟩` term and no `|10⟩` term. The two qubits are perfectly correlated: if you measure one and find it in state `|0⟩`, the other is also in state `|0⟩`; if the first comes out `|1⟩`, the second is `|1⟩` as well. This perfect correlation persists no matter how far apart the two qubits are at the moment of measurement.

The second thing to notice is harder. Try to write `|Φ⟩` as a product `|ψ⟩₁ ⊗ |ψ⟩₂` for any choice of single-qubit states `|ψ⟩₁` and `|ψ⟩₂`. You cannot. If you expand any such product you always get four terms, and you cannot arrange the coefficients so that the `|01⟩` and `|10⟩` terms vanish while the `|00⟩` and `|11⟩` terms survive with equal weight. The joint state simply is not the product of any pair of single-qubit states. That is the formal statement that the state is entangled.

The third thing to notice is the strangest. Before you measure either qubit, neither qubit has a definite value. The state is a superposition. After you measure one qubit, you know the value of the other instantly, even if it is on the other side of the galaxy. This is the phenomenon Einstein called spooky. We will spend the rest of the chapter unpacking what it does and does not mean.

---

## 7.4 The EPR argument

In 1935, Einstein, Podolsky, and Rosen — the three together usually shortened to EPR — published a paper arguing that quantum mechanics, as it stood, must be incomplete. Their argument did not claim quantum mechanics was wrong about its predictions. It claimed that quantum mechanics could not be the whole story, because the joint states it predicted seemed to require either faster-than-light influences or hidden variables that the formalism did not name.

The argument runs as follows. Prepare a pair of particles in an entangled state — the Bell state of the previous section is a fine example, though EPR used a slightly different setup. Send one particle to a laboratory in city A and the other to a laboratory in city B, very far apart. According to quantum mechanics, neither particle has a definite value of, say, spin along the vertical axis until someone measures it. But the two particles are perfectly correlated, so the moment the experimenter in A measures her particle and gets, say, spin-up, she knows with certainty that the experimenter in B will get spin-down on his particle if he measures along the same axis.

Here is the EPR move. They argue that if A's measurement does not physically influence B's particle — and surely it cannot, if the labs are far enough apart that no signal traveling at light speed could connect them — then B's particle must have *already had* a definite value of spin before A measured. Otherwise, how could the perfect correlation be guaranteed? The conclusion they drew was that quantum mechanics, by failing to assign B's particle a definite value before measurement, was leaving something out. They called this missing description a *hidden variable*.

The EPR paper was a careful and respectful complaint. It did not say quantum mechanics was wrong. It said it was incomplete, and it left open the possibility that a deeper theory would supply the missing values. For nearly thirty years, this seemed like a reasonable thing to hope for. Then John Bell ruined the hope.

---

## 7.5 Bell's theorem

In 1964, John Bell proved a theorem that turned the EPR debate from philosophy into experiment. Bell's insight was to realize that hidden-variable theories make different predictions from quantum mechanics in certain experiments, even if both theories make the same prediction in the simple cases EPR considered. In particular, if you measure entangled particles along *different* axes — not the same axis, as in the original EPR setup, but axes chosen at angles to each other — the statistics of the correlations differ between any local hidden-variable theory and quantum mechanics.

The word "local" matters. A local hidden-variable theory is one in which each particle carries a complete set of values that determine the result of any measurement, and these values are not influenced by what is done to the other particle far away. Bell showed that any theory satisfying this locality condition must obey a certain inequality — now called the Bell inequality, or in its most experimentally convenient form the CHSH inequality — relating the correlation functions of measurements at different angles. He then showed that quantum mechanics violates this inequality.

This is a very strong result. It says: either quantum mechanics is wrong about what happens when you measure entangled particles at different angles, or no local hidden-variable theory can reproduce its predictions. Either nature is non-local, or it does not have the property of definite-values-before-measurement that EPR took for granted. There is no way to keep both.

For Bell's theorem to be more than a mathematical curiosity, someone had to actually do the experiment. The first attempts in the 1970s were suggestive but had loopholes. Through the 1980s, 1990s, and 2010s, the experiments became progressively cleaner. By 2015, several groups had performed *loophole-free* Bell tests — experiments that closed all known ways for a clever local hidden-variable theory to escape the conclusion. Every loophole-free test has come down on the side of quantum mechanics. The Bell inequality is violated in nature. Local hidden-variable theories are ruled out, not as a matter of philosophical preference, but as a matter of experimental fact.

The 2022 Nobel Prize in Physics was awarded to Alain Aspect, John Clauser, and Anton Zeilinger for these experiments and the methods that made them possible.

---

## 7.6 What entanglement is not

It is worth pausing here, because the previous section can be misread. The most common misreading is to say that Bell's theorem shows information can travel faster than light. It does not. The reason is delicate, and getting it right is one of the most important things you will take away from this chapter.

Consider again the two laboratories, A and B, with their entangled particles. When the experimenter in A measures her particle and gets, say, spin-up, she now knows that the experimenter in B will get spin-down. From her point of view, the act of measurement in A has determined the result in B, instantly, no matter how far apart they are.

But notice what the experimenter in B sees. He does not know that A has measured anything. From his local point of view, his particle just produces a random outcome — fifty percent of the time spin-up, fifty percent spin-down — exactly as quantum mechanics predicts for a particle in a thoroughly mixed state. There is nothing in his data that he can use to detect that A measured first, or to detect what A's result was, or even to detect that A exists. The only way he can learn anything about A's measurement is for A to send him a message *through ordinary classical channels*, which travel no faster than light.

This is not a coincidence. It is a theorem, sometimes called the *no-communication theorem* or the *no-signaling theorem*, and it is provable from the structure of quantum mechanics. The theorem says that no measurement performed on one part of an entangled pair, however cleverly chosen, can produce a statistical signature in the other part that depends on what was measured. Entanglement produces correlations between distant outcomes; it does not produce signals.

So when you read in popular accounts that "entangled particles communicate instantly," remember that the word "communicate" is doing too much work. They produce correlated outcomes, yes. But neither side can use those correlations to send a message. The correlation is only visible *after* the two sides bring their results together and compare, and bringing them together requires classical communication, which is bound by the speed of light.

This distinction — between correlations and signals — is one of the most important conceptual moves in modern physics, and it is the reason Bell's theorem is compatible with relativity rather than in violation of it.

---

## 7.7 Decoherence: why entanglement is fragile

If entanglement is so striking, why don't we see it everywhere? Why does the world look classical at the scale of coffee cups and chairs, when its underlying description is so deeply non-classical?

The answer is decoherence. Entangled states are extraordinarily delicate. Any interaction with the environment — a stray photon, a passing air molecule, a vibration of the apparatus — can entangle the system with the environment, which in practice destroys the experimentally accessible entanglement between the two parts you cared about. The information that was concentrated in the joint state of your two qubits leaks out into the environment, where it is effectively lost.

The mathematics of this leakage is beyond the scope of this chapter, but the intuition is straightforward. When your two qubits become entangled with millions of degrees of freedom in the environment, the reduced state of just your two qubits — the state you can access without tracking the environment — looks like a classical statistical mixture, not a quantum superposition. The interference patterns that revealed the entanglement disappear. The Bell inequality, when measured on this leaked state, is no longer violated.

This is why building a quantum computer is hard. A quantum computer's power depends on maintaining entanglement across many qubits long enough to perform a calculation. Every coupling to the environment is a leak. The engineering challenge of quantum computing is not making entanglement happen — that part is straightforward — but keeping it from leaking out faster than you can use it.

Decoherence also explains why the world looks classical. Macroscopic objects are made of enormous numbers of particles in constant contact with their environments. Any superposition of macroscopic states decoheres almost instantly into a statistical mixture. The quantum strangeness is still there at the microscopic level, but it averages out at the scale of human experience.

---

## 7.8 Entanglement as a resource

The modern view of entanglement is not as a paradox to be explained away, but as a *resource* to be harnessed. This shift in perspective, which began in the 1990s, is the foundation of the field now called quantum information science.

Three applications stand out.

The first is *quantum teleportation*. Despite the name, this is not a transporter from science fiction. Quantum teleportation is a protocol by which two parties who share an entangled pair can transfer the unknown quantum state of a third particle from one to the other, using only the entangled pair plus two classical bits of communication. The third particle is not physically transported; its state is. The original is destroyed in the process — there is a separate theorem, the *no-cloning theorem*, that says quantum states cannot be copied. Teleportation has been demonstrated experimentally over distances of more than a thousand kilometers, including from the ground to a satellite.

The second is *quantum cryptography*, in particular the BB84 and E91 key-distribution protocols. These protocols allow two distant parties to generate a shared random key — a string of bits that they both know and no one else can know — using the laws of quantum mechanics to detect any eavesdropper. The security guarantee is unconditional: it does not rest on assumptions about the eavesdropper's computational power, but on the structure of quantum mechanics itself. Commercial quantum-key-distribution systems are now deployed in several countries.

The third is *quantum computation*. A quantum computer is a device that uses entanglement and superposition to perform certain calculations exponentially faster than any classical computer. The most famous example is Shor's algorithm for factoring large integers, which would break much of current public-key cryptography if a sufficiently large quantum computer existed. Building one remains an active engineering challenge, but the theoretical case that it would be possible is very strong, and small quantum computers — tens to hundreds of qubits — already exist.

In each of these applications, entanglement plays the role of a resource: a thing you set up beforehand, consume in the protocol, and account for in the way you would account for fuel or memory or bandwidth. This is a deep change of attitude. The phenomenon Einstein found most disturbing has become a unit of currency.

---

## 7.9 What entanglement teaches

Stepping back from the applications, what does entanglement teach us about the structure of physical reality? Three lessons stand out, in increasing order of philosophical weight.

The first lesson is technical: physical systems are not collections of separately specified parts. The state of a composite quantum system contains information that is not present in the state of any of its components. The whole is, in a precise mathematical sense, more than the sum of its parts. This is mostly a fact about Hilbert spaces and tensor products, but it has consequences whenever the world is sufficiently isolated to behave quantum-mechanically.

The second lesson is empirical: at least one of three deeply held assumptions about how the world works is false. Either there are no definite values before measurement (a denial of *realism*), or distant influences exist (a denial of *locality*), or experimenters are not free to choose what to measure (a denial of *measurement independence*). Different interpretations of quantum mechanics deny different ones, but all the consistent interpretations deny at least one. There is no interpretation that keeps all three.

The third lesson is methodological: questions that seem like philosophy can become physics. The EPR debate spent thirty years looking like a philosophical disagreement about what theories should be required to do. Bell's theorem turned that disagreement into an experimental question, and the experiments answered it. This pattern — philosophical clarity becoming empirical content — is one of the characteristic moves of twentieth-century physics, and it is a useful one to have in mind whenever you encounter a "merely philosophical" objection to a physical theory.

---

## 7.10 Where to go next

This chapter has been deliberately introductory. There is much more to say about entanglement than fits in these pages, and you should expect to meet several of the following topics in the chapters that follow.

The mathematics of entanglement quantification — entanglement entropy, Schmidt decomposition, mixed-state entanglement measures — extends the simple notion of "entangled or not" into a rich quantitative theory. There is a precise sense in which some entangled states are more entangled than others, and the theory of how to measure and manipulate this is well developed.

The connection between entanglement and thermodynamics is one of the most active areas of current theoretical physics. There are striking parallels between entanglement entropy and ordinary thermodynamic entropy, and these parallels turn out to have something to do with black holes, quantum gravity, and the structure of spacetime itself. The phrase you will encounter is the *holographic principle*, and it suggests, at a level that is still being worked out, that the geometry of space may be made of entanglement.

The engineering of entanglement at scale — building quantum computers and quantum networks that can sustain entanglement across thousands of qubits and across continental distances — is the biggest applied physics project of the early twenty-first century. The progress over the past five years has been remarkable, and there is reason to expect that within your professional lifetime there will be quantum computers that solve problems no classical machine can.

Whichever of these directions interests you most, the foundation is the same: a clear understanding of what entanglement is, what it is not, and why it had to be discovered rather than invented. That foundation is what this chapter has tried to provide.

---

## Section summaries

**§7.1** Entanglement is a real, experimentally verified feature of nature, central to quantum information science. The chapter aims to clarify what it is and what it forces us to give up.

**§7.2** Composite quantum systems live in tensor-product spaces. Most joint states cannot be written as a product of single-system states; those that cannot are called entangled.

**§7.3** The Bell state `(|00⟩ + |11⟩)/√2` is the simplest entangled state. It exhibits perfect correlation between two qubits with no separate description of either part.

**§7.4** Einstein, Podolsky, and Rosen argued in 1935 that perfect correlations imply pre-existing values, and that quantum mechanics, by denying these, must be incomplete.

**§7.5** Bell proved in 1964 that any local hidden-variable theory must obey an inequality that quantum mechanics violates. Loophole-free experiments since 2015 have confirmed the violation, ruling out local hidden variables.

**§7.6** Entanglement produces correlations, not signals. The no-communication theorem ensures that no information can be transmitted faster than light using entangled particles.

**§7.7** Decoherence destroys experimentally accessible entanglement when a system couples to its environment. This is why the macroscopic world looks classical and why building quantum computers is hard.

**§7.8** Modern quantum information science treats entanglement as a resource powering teleportation, cryptography, and computation.

**§7.9** Entanglement forces us to give up at least one of realism, locality, or measurement independence. It also exemplifies how philosophical questions can become experimental.

**§7.10** Quantitative entanglement measures, the connection to thermodynamics and gravity, and the engineering of entanglement at scale are all directions for further study.