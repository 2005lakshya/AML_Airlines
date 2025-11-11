"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Footer from "@/components/footer"

const offers = [
	{
		id: 1,
		title: "Domestic Flight Bonanza",
		description: "Save big on all domestic routes",
		discount: "Up to 25% OFF",
		code: "DOMESTIC25",
		validTill: "31st Oct 2025",
		color: "from-blue-500 to-blue-600",
		icon: "🛫",
	},
	{
		id: 2,
		title: "Digital Wallet Boost",
		description: "Extra savings with wallet payments",
		discount: "Extra 15% OFF",
		code: "WALLET15",
		validTill: "15th Nov 2025",
		color: "from-green-500 to-green-600",
		icon: "💳",
	},
	{
		id: 3,
		title: "Student Special",
		description: "Exclusive offers for students",
		discount: "Flat ₹2,500 OFF",
		code: "STUDENT2500",
		validTill: "25th Dec 2025",
		color: "from-purple-500 to-purple-600",
		icon: "🎓",
	},
	{
		id: 4,
		title: "International Explorer",
		description: "Discover the world with amazing deals",
		discount: "Up to 30% OFF",
		code: "INTL30",
		validTill: "30th Nov 2025",
		color: "from-orange-500 to-orange-600",
		icon: "🌍",
	},
	{
		id: 5,
		title: "Early Bird Special",
		description: "Book 30 days in advance",
		discount: "Save 20% MORE",
		code: "EARLY20",
		validTill: "31st Dec 2025",
		color: "from-pink-500 to-pink-600",
		icon: "⏰",
	},
	{
		id: 6,
		title: "Weekend Getaway",
		description: "Perfect for short trips",
		discount: "₹3,000 OFF",
		code: "WEEKEND3K",
		validTill: "20th Nov 2025",
		color: "from-teal-500 to-teal-600",
		icon: "🏖️",
	},
]

const featuredOffers = [
	{
		id: "feat-1",
		title: "Mega Sale",
		subtitle: "Limited Time Only",
		description:
			"Get the best deals on domestic and international flights. Book now and save big!",
		discount: "Up to 40% OFF",
		code: "MEGASALE40",
		validTill: "31st October 2025",
		bgImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		features: [
			"No hidden charges",
			"Free cancellation",
			"Instant confirmation",
		],
	},
	{
		id: "feat-2",
		title: "Business Class Upgrade",
		subtitle: "Luxury at affordable prices",
		description:
			"Experience premium comfort with our exclusive business class upgrade offers.",
		discount: "50% OFF Upgrades",
		code: "BUSINESS50",
		validTill: "15th November 2025",
		bgImage: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
		features: ["Priority boarding", "Extra legroom", "Premium meals"],
	},
]

export default function OffersPage() {
	const trackRef = useRef(null)
	const [copiedCode, setCopiedCode] = useState(null)

	useEffect(() => {
		const el = trackRef.current
		if (!el) return
		let raf
		let x = 0
		const loop = () => {
			x -= 0.5
			el.style.transform = `translateX(${x}px)`
			if (Math.abs(x) > el.scrollWidth / 2) x = 0
			raf = requestAnimationFrame(loop)
		}
		raf = requestAnimationFrame(loop)
		return () => cancelAnimationFrame(raf)
	}, [])

	const copyCode = (code) => {
		navigator.clipboard.writeText(code)
		setCopiedCode(code)
		setTimeout(() => setCopiedCode(null), 2000)
	}

	return (
		<div className="min-h-screen bg-black flex flex-col pt-24">
			<div className="max-w-5xl mx-auto w-full flex-1 flex flex-col px-6 py-12">
				<section className="mx-auto w-full max-w-7xl px-6">
					{/* Hero Section */}
					<div className="text-center mb-12">
						<motion.h1
							className="text-4xl md:text-5xl font-bold text-white mb-4"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
						>
							Amazing Flight Deals
						</motion.h1>
						<motion.p
							className="text-lg text-white/80 max-w-2xl mx-auto"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
						>
							Discover exclusive offers and save big on your next adventure.
							Limited time deals you don't want to miss!
						</motion.p>
					</div>

					{/* Featured Offers */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
						{featuredOffers.map((offer, index) => (
							<motion.div
								key={offer.id}
								className="relative rounded-2xl p-8 text-white overflow-hidden group cursor-pointer bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
								style={{ background: offer.bgImage }}
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
								whileHover={{ scale: 1.02 }}
							>
								<div className="relative z-10">
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="text-2xl font-bold mb-1">
												{offer.title}
											</h3>
											<p className="text-white/80 text-sm">
												{offer.subtitle}
											</p>
										</div>
										<div className="text-right">
											<div className="text-2xl font-bold">
												{offer.discount}
											</div>
											<div className="text-xs text-white/80">
												Valid till {offer.validTill}
											</div>
										</div>
									</div>
									<p className="text-white/90 mb-4">
										{offer.description}
									</p>
									<div className="flex flex-wrap gap-2 mb-6">
										{offer.features.map((feature, idx) => (
											<span
												key={idx}
												className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium"
											>
												✓ {feature}
											</span>
										))}
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<span className="px-4 py-2 bg-white/20 rounded-lg font-mono text-sm font-bold">
												{offer.code}
											</span>
											<button
												onClick={() => copyCode(offer.code)}
												className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-white/90 transition-colors"
											>
												{copiedCode === offer.code
													? "Copied!"
													: "Copy Code"}
											</button>
										</div>
									</div>
								</div>
								{/* Background decoration */}
								<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							</motion.div>
						))}
					</div>

					{/* More Offers Section */}
					<div className="mb-8">
						<h2 className="text-2xl font-bold mb-6 text-center text-white">
							More Great Deals
						</h2>
						{/* Scrolling offers banner */}
						<div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur mb-8">
							<div
								className="flex whitespace-nowrap"
								ref={trackRef}
								aria-hidden="true"
							>
								{[...offers, ...offers].map((offer, index) => (
									<motion.div
										key={`${offer.id}-${index}`}
										className={`mx-3 inline-flex min-w-[320px] items-center justify-between rounded-xl bg-gradient-to-r ${offer.color} p-4 text-white shadow-lg`}
										whileHover={{ scale: 1.05 }}
									>
										<div className="flex items-center gap-3">
											<div className="text-2xl">{offer.icon}</div>
											<div>
												<p className="font-bold text-sm">
													{offer.title}
												</p>
												<p className="text-xs text-white/80">
													{offer.description}
												</p>
												<p className="text-lg font-bold">
													{offer.discount}
												</p>
											</div>
										</div>
										<button
											onClick={() => copyCode(offer.code)}
											className="rounded-lg bg-white/20 px-3 py-2 text-xs font-medium backdrop-blur hover:bg-white/30 transition-colors"
										>
											{copiedCode === offer.code
												? "Copied!"
												: "Copy"}
										</button>
									</motion.div>
								))}
							</div>
						</div>

						{/* Static offers grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{offers.map((offer, index) => (
								<motion.div
									key={offer.id}
									className="group relative rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl hover:shadow-lg transition-all duration-300 text-white"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									whileHover={{ y: -5 }}
								>
									<div
										className={`absolute inset-0 bg-gradient-to-r ${offer.color} opacity-5 rounded-xl`}
									/>

									<div className="relative">
										<div className="flex items-start justify-between mb-4">
											<div className="text-3xl">{offer.icon}</div>
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${offer.color} text-white`}
											>
												Limited Time
											</span>
										</div>

										<h3 className="font-bold text-lg mb-2">
											{offer.title}
										</h3>
										<p className="text-sm text-white/80 mb-3">
											{offer.description}
										</p>
										<div
											className={`text-2xl font-bold bg-gradient-to-r ${offer.color} bg-clip-text text-transparent mb-3`}
										>
											{offer.discount}
										</div>

										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs text-white/60">Code:</p>
												<p className="font-mono font-bold text-sm">
													{offer.code}
												</p>
												<p className="text-xs text-white/60">
													Valid till {offer.validTill}
												</p>
											</div>
											<button
												onClick={() => copyCode(offer.code)}
												className={`px-4 py-2 rounded-lg font-medium transition-all bg-gradient-to-r ${offer.color} text-white hover:shadow-lg hover:scale-105`}
											>
												{copiedCode === offer.code
													? "Copied!"
													: "Copy Code"}
											</button>
										</div>
									</div>
								</motion.div>
							))}
						</div>
					</div>

					{/* Terms and Conditions */}
					<motion.div
						className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl text-white"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.5 }}
					>
						<h3 className="font-bold text-lg mb-4">Terms & Conditions</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
							<div>
								<h4 className="font-medium text-foreground mb-2">
									General Terms
								</h4>
								<ul className="space-y-1">
									<li>• Offers valid for limited time only</li>
									<li>• Cannot be combined with other offers</li>
									<li>• Applicable on select routes and dates</li>
									<li>• Subject to availability</li>
								</ul>
							</div>
							<div>
								<h4 className="font-medium text-foreground mb-2">
									Booking Guidelines
								</h4>
								<ul className="space-y-1">
									<li>• Apply coupon code at checkout</li>
									<li>• Valid for one-time use per customer</li>
									<li>• Minimum booking value may apply</li>
									<li>• Standard cancellation policy applies</li>
								</ul>
							</div>
						</div>
					</motion.div>
				</section>
			</div>
			<Footer />
		</div>
	)
}
