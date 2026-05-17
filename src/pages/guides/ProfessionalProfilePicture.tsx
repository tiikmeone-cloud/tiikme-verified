import GuideLayout from "./GuideLayout";
import { GUIDES, getRelated } from "./registry";

const meta = GUIDES.find((g) => g.slug === "professional-profile-picture")!;

const ProfessionalProfilePicture = () => (
  <GuideLayout meta={meta} related={getRelated(meta.slug)}>
    <p>
      You do not need a photographer. You do not need a studio. You need a
      phone, a window, ten minutes, and someone willing to press the shutter.
      Here is the full checklist.
    </p>

    <h2>The fundamentals</h2>
    <ul>
      <li><strong>Use natural light.</strong> Stand facing a window, light hitting your face. Mid-morning is best.</li>
      <li><strong>Plain background.</strong> A white wall, a beige wall, a wooden door. No bedrooms, no clutter, no group photos.</li>
      <li><strong>Phone at eye level.</strong> Photos from below make a double chin. Photos from above make you look small.</li>
      <li><strong>Frame from chest up.</strong> Head, shoulders, a little chest. Do not crop tightly at the chin.</li>
      <li><strong>Use a real camera app.</strong> Not the front-facing selfie camera. Hand the phone to someone.</li>
    </ul>

    <h2>What to wear</h2>
    <p>
      Dress one level above the job you want. If everyone in the office wears
      a t-shirt, wear a plain shirt. If everyone wears a shirt, wear a blazer.
      Avoid:
    </p>
    <ul>
      <li>Patterned shirts and busy prints. They distract.</li>
      <li>Pure white shirts on a white background. You will disappear.</li>
      <li>Sunglasses, caps, or anything covering your face.</li>
      <li>The same selfie from your last vacation.</li>
    </ul>

    <h2>How to look natural in front of a camera</h2>
    <ul>
      <li>Take 30 photos, not 3. Most will be bad. That is fine.</li>
      <li>Smile lightly. Not a grin, not a stare. Think of someone you like.</li>
      <li>Roll your shoulders back. Most people unconsciously slump on camera.</li>
      <li>Look slightly above the lens for the first few shots. It makes the eyes more open.</li>
    </ul>

    <h2>After the shot</h2>
    <ul>
      <li>Crop square. Most professional profiles render as a square or circle.</li>
      <li>Increase brightness slightly. Most phones underexpose faces.</li>
      <li>Do not over-edit. No skin-smoothing filters. They are obvious and unprofessional.</li>
      <li>Save a 1000 × 1000 px version. Anything smaller will look blurry.</li>
    </ul>

    <h2>Common mistakes</h2>
    <div className="example bad">
      <span className="label">Avoid</span>
      <p>
        Cropped group photo from a wedding. Backlit silhouette. Selfie in a
        car. Filter that smooths your skin into porcelain. Black-and-white
        photo from ten years ago when you had different hair.
      </p>
    </div>

    <div className="example good">
      <span className="label">What to aim for</span>
      <p>
        Plain wall behind you. Soft daylight from the side. You from the chest
        up, in clothes you would actually wear to work. A small, genuine
        smile. Eyes looking straight at the lens.
      </p>
    </div>

    <h2>If you absolutely cannot take one yourself</h2>
    <p>
      A 30-minute session at a local photo studio costs ₹300 to ₹800 in most
      Indian cities. Ask for "passport-style with neutral background, chest-up
      framing, soft lighting". Take five outfits. Pick one shot.
    </p>

    <blockquote>
      A profile picture is not vanity. It is the first proof that you are a
      real person. Treat it as part of your application, not an afterthought.
    </blockquote>
  </GuideLayout>
);

export default ProfessionalProfilePicture;
